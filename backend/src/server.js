/**
 * ============================================================
 * SIRESA — Servidor Principal (Entry Point)
 * Secretaría de Desarrollo Rural de Nayarit
 * ============================================================
 *
 * Este archivo inicializa y configura el servidor Express:
 *  - Validación Fail-Fast de Variables de Entorno (A-7)
 *  - Middlewares de seguridad (Helmet, CORS, Rate Limiting)
 *  - Parseo de solicitudes JSON
 *  - Montaje de todas las rutas de la API
 *  - Servicio protegido de archivos estáticos (C-4)
 *  - Health Check con prueba de conectividad a PostgreSQL (B-3)
 *  - Manejadores de errores globales
 *  - Graceful Shutdown (apagado limpio con cierre del pool de BD)
 */

import path from 'path';
import fs from 'fs';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import jwt from 'jsonwebtoken';
import * as dotenv from 'dotenv';

// Importación de módulos de rutas por dominio de negocio
import authRoutes from './modules/auth/authRoutes.js';
import catalogoRoutes from './modules/catalogos/catalogoRoutes.js';
import solicitudRoutes from './modules/solicitudes/solicitudRoutes.js';
import uploadRoutes from './modules/upload/uploadRoutes.js';
import presupuestoRoutes from './modules/presupuestos/presupuestoRoutes.js';
import userRoutes from './modules/users/userRoutes.js';
import directorioRoutes from './modules/directorio/directorioRoutes.js';
import { autoDeduplicateProductores } from './modules/solicitudes/solicitudService.js';

// Manejadores globales de errores HTTP
import { errorHandler, notFoundHandler } from './shared/middleware/errorHandler.js';

// Pool de conexiones de PostgreSQL (para Health Check y Graceful Shutdown)
import { pool } from './shared/config/db.js';

// Logger estructurado
import logger from './shared/utils/logger.js';

// Cargar variables de entorno desde el archivo .env
dotenv.config();

// ─── A-7: Validación Fail-Fast de Variables de Entorno ───────────────────────
// Verificar que las variables de entorno críticas estén configuradas antes de arrancar el servidor
const REQUIRED_ENV_VARS = ['DATABASE_URL', 'JWT_SECRET'];
const missingEnvVars = REQUIRED_ENV_VARS.filter(key => !process.env[key]);

if (missingEnvVars.length > 0) {
  logger.error(`CRITICAL: Faltan variables de entorno requeridas: ${missingEnvVars.join(', ')}`);
  logger.error('El servidor no puede arrancar sin estas configuraciones.');
  process.exit(1);
}

const app = express();

// Puerto del servidor: usa la variable de entorno PORT (Railway/Render la inyecta) o 5000 por defecto
const PORT = process.env.PORT || 5000;

// ─── Seguridad HTTP ────────────────────────────────────────────────────────────
// Helmet agrega cabeceras HTTP de seguridad automáticamente (XSS, HSTS, etc.)
app.use(helmet({
  crossOriginResourcePolicy: false
}));

// ─── CORS (Cross-Origin Resource Sharing) ─────────────────────────────────────
const allowedOrigins = (process.env.CORS_ORIGINS || 'http://localhost:5173')
  .split(',')
  .map(o => o.trim());

app.use(cors({
  origin: (origin, callback) => {
    // Permitir requests sin origin (Postman, aplicaciones móviles, health checks)
    if (!origin) return callback(null, true);

    // Si CORS_ORIGINS incluye '*', permitir cualquier origen
    if (allowedOrigins.includes('*')) return callback(null, true);

    // Solo permitir orígenes explícitamente declarados en CORS_ORIGINS
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    callback(new Error(`Origen ${origin} no permitido por CORS.`));
  },
  credentials: true
}));

// ─── B-4: Rate Limiting General para la API ────────────────────────────────────
// Limitar peticiones masivas por IP para prevenir ataques DoS
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 300,                 // Máximo 300 peticiones por ventana de 15 min por IP
  message: { error: 'Demasiadas peticiones desde esta IP. Intenta de nuevo más tarde.' },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api/', globalLimiter);

// ─── B-7: Parseo de cuerpo JSON restringido ────────────────────────────────────
// Limita el tamaño del body a 100kb para prevenir ataques de denegación de servicio
app.use(express.json({ limit: '100kb' }));

// ─── Rutas de la API ───────────────────────────────────────────────────────────
app.use('/api/auth', authRoutes);           // Login, verificación de sesión
app.use('/api/catalogos', catalogoRoutes);  // Municipios, localidades y listas de catálogos
app.use('/api/solicitudes', solicitudRoutes); // CRUD de expedientes y trámites
app.use('/api/upload', uploadRoutes);       // Subida de archivos PDF e imágenes
app.use('/api/presupuestos', presupuestoRoutes); // Gestión de presupuestos sectoriales
app.use('/api/users', userRoutes);          // Gestión de usuarios del sistema (RBAC)
app.use('/api/directorio', directorioRoutes); // Módulo de Geodirectorio y Visor Cartográfico

// ─── C-4: Servicio Protegido de Archivos Estáticos ─────────────────────────────
// Los archivos subidos (PDFs, imágenes) solo son accesibles si el cliente presenta
// un token JWT válido (ya sea en el header Authorization o via parámetro query ?token=)
app.get('/uploads/:filename', (req, res) => {
  const filename = path.basename(req.params.filename); // Prevenir Path Traversal
  const filePath = path.join(process.cwd(), 'uploads', filename);

  // Extraer token desde header Authorization o parametro URL ?token=
  const authHeader = req.headers.authorization;
  let token = null;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.split(' ')[1];
  } else if (req.query.token) {
    token = req.query.token;
  }

  if (!token) {
    res.status(401).json({ error: 'Acceso denegado. Se requiere autenticación para ver los archivos.' });
    return;
  }

  try {
    jwt.verify(token, process.env.JWT_SECRET);
  } catch (err) {
    res.status(403).json({ error: 'Token inválido o expirado para acceder al archivo.' });
    return;
  }

  // Verificar existencia del archivo
  if (!fs.existsSync(filePath)) {
    res.status(404).json({ error: 'Archivo no encontrado.' });
    return;
  }

  res.sendFile(filePath);
});

// ─── B-3: Health Check con Prueba de Conexión a Base de Datos ──────────────────
app.get('/health', async (_req, res) => {
  try {
    // Probar conectividad real con PostgreSQL ejecutando SELECT 1
    await pool.query('SELECT 1');
    res.json({
      status: 'ok',
      db: 'connected',
      timestamp: new Date(),
      message: 'Servidor SIRESA y Base de Datos operando correctamente.'
    });
  } catch (error) {
    logger.error('Health Check falló al verificar la base de datos:', error);
    res.status(500).json({
      status: 'error',
      db: 'disconnected',
      timestamp: new Date(),
      message: 'El servidor está activo pero no puede comunicarse con PostgreSQL.'
    });
  }
});

// ─── Manejo de Errores ─────────────────────────────────────────────────────────
app.use(notFoundHandler);
app.use(errorHandler);

// ─── Inicio del Servidor ───────────────────────────────────────────────────────
const server = app.listen(PORT, '0.0.0.0', () => {
  logger.info(`==================================================`);
  logger.info(` Servidor SIRESA — Secretaría de Desarrollo Rural`);
  logger.info(` - Puerto: ${PORT}`);
  logger.info(` - URL local: http://localhost:${PORT}`);
  logger.info(` - Orígenes CORS permitidos: ${allowedOrigins.join(', ')}`);
  logger.info(`==================================================`);

  // Ejecutar consolidación y desduplicación automática del padrón en la base de datos
  autoDeduplicateProductores();
});

// ─── Graceful Shutdown ─────────────────────────────────────────────────────────
function gracefulShutdown(signal) {
  logger.info(`${signal} recibido. Cerrando servidor HTTP...`);
  server.close(async () => {
    try {
      await pool.end();
      logger.info('Pool de conexiones de base de datos cerrado.');
    } catch (err) {
      logger.error('Error al cerrar el pool de conexiones:', err);
    }
    logger.info('Servidor cerrado correctamente.');
    process.exit(0);
  });

  setTimeout(() => process.exit(1), 10000);
}

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
