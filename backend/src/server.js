/**
 * ============================================================
 * SIRESA — Servidor Principal (Entry Point)
 * Secretaría de Desarrollo Rural de Nayarit
 * ============================================================
 *
 * Este archivo inicializa y configura el servidor Express:
 *  - Middlewares de seguridad (Helmet, CORS)
 *  - Parseo de solicitudes JSON
 *  - Montaje de todas las rutas de la API
 *  - Servicio de archivos estáticos (PDFs/imágenes subidos)
 *  - Manejadores de errores globales
 *  - Graceful Shutdown (apagado limpio con cierre del pool de BD)
 */

import path from 'path';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import * as dotenv from 'dotenv';

// Importación de módulos de rutas por dominio de negocio
import authRoutes from './modules/auth/authRoutes.js';
import catalogoRoutes from './modules/catalogos/catalogoRoutes.js';
import solicitudRoutes from './modules/solicitudes/solicitudRoutes.js';
import uploadRoutes from './modules/upload/uploadRoutes.js';
import presupuestoRoutes from './modules/presupuestos/presupuestoRoutes.js';
import userRoutes from './modules/users/userRoutes.js';

// Manejadores globales de errores HTTP
import { errorHandler, notFoundHandler } from './shared/middleware/errorHandler.js';

// Pool de conexiones de PostgreSQL (para el Graceful Shutdown)
import { pool } from './shared/config/db.js';

// Logger estructurado
import logger from './shared/utils/logger.js';

// Cargar variables de entorno desde el archivo .env (solo en desarrollo)
dotenv.config();

const app = express();

// Puerto del servidor: usa la variable de entorno PORT (Railway/Render la inyecta) o 5000 por defecto
const PORT = process.env.PORT || 5000;

// ─── Seguridad HTTP ────────────────────────────────────────────────────────────
// Helmet agrega cabeceras HTTP de seguridad automáticamente (XSS, HSTS, etc.)
// Se desactiva crossOriginResourcePolicy para permitir que el frontend
// acceda a los archivos estáticos de /uploads directamente (PDFs, imágenes)
app.use(helmet({
  crossOriginResourcePolicy: false
}));

// ─── CORS (Cross-Origin Resource Sharing) ─────────────────────────────────────
// Define qué dominios externos pueden hacer peticiones a esta API.
// Se lee la lista de orígenes permitidos desde la variable de entorno CORS_ORIGINS.
// Si CORS_ORIGINS='*', cualquier origen puede acceder (útil para demos/desarrollo).
// En producción se recomienda especificar el dominio exacto del frontend.
const allowedOrigins = (process.env.CORS_ORIGINS || 'http://localhost:5173')
  .split(',')
  .map(o => o.trim());

app.use(cors({
  origin: (origin, callback) => {
    // Permitir requests sin origin (Postman, aplicaciones móviles, health checks)
    if (!origin) return callback(null, true);

    // Si CORS_ORIGINS incluye '*', permitir cualquier origen
    if (allowedOrigins.includes('*')) return callback(null, true);

    // Si el origen coincide con la lista configurada o es un subdominio de vercel.app
    if (allowedOrigins.includes(origin) || origin.endsWith('.vercel.app')) {
      return callback(null, true);
    }

    // Rechazar cualquier otro origen no reconocido
    callback(new Error(`Origen ${origin} no permitido por CORS.`));
  },
  credentials: true // Permite envío de cookies y cabeceras de autorización
}));

// ─── Parseo de cuerpo JSON ─────────────────────────────────────────────────────
// Limita el tamaño del body a 1MB para prevenir ataques de denegación de servicio
// que intenten enviar payloads extremadamente grandes.
app.use(express.json({ limit: '1mb' }));

// ─── Rutas de la API ───────────────────────────────────────────────────────────
// Cada módulo de negocio tiene su propio conjunto de rutas aisladas.
// El prefijo /api/* es estándar para distinguir la API REST del frontend estático.
app.use('/api/auth', authRoutes);           // Login, verificación de sesión
app.use('/api/catalogos', catalogoRoutes);  // Municipios, localidades y listas de catálogos
app.use('/api/solicitudes', solicitudRoutes); // CRUD de expedientes y trámites
app.use('/api/upload', uploadRoutes);       // Subida de archivos PDF e imágenes
app.use('/api/presupuestos', presupuestoRoutes); // Gestión de presupuestos sectoriales
app.use('/api/users', userRoutes);          // Gestión de usuarios del sistema (RBAC)

// ─── Archivos Estáticos ────────────────────────────────────────────────────────
// Sirve los archivos subidos (PDFs, imágenes) desde la carpeta /uploads.
// Las URLs de acceso quedan como: GET /uploads/<nombre-del-archivo>
// NOTA DE SEGURIDAD: Actualmente son públicos. En producción, proteger con authMiddleware.
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

// ─── Health Check ─────────────────────────────────────────────────────────────
// Endpoint simple para que Railway/Render/monitores verifiquen que el servidor está vivo.
app.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date(),
    message: 'Servidor SIRESA operando correctamente.'
  });
});

// ─── Manejo de Errores ─────────────────────────────────────────────────────────
// notFoundHandler: captura rutas que no existen → responde con 404
// errorHandler: captura cualquier error lanzado en los controladores → responde con 5xx o error específico
app.use(notFoundHandler);
app.use(errorHandler);

// ─── Inicio del Servidor ───────────────────────────────────────────────────────
// Se escucha en '0.0.0.0' para que Railway y otros entornos containerizados
// puedan enrutar el tráfico al servidor (no solo localhost).
const server = app.listen(PORT, '0.0.0.0', () => {
  logger.info(`==================================================`);
  logger.info(` Servidor SIRESA — Secretaría de Desarrollo Rural`);
  logger.info(` - Puerto: ${PORT}`);
  logger.info(` - URL local: http://localhost:${PORT}`);
  logger.info(` - Orígenes CORS permitidos: ${allowedOrigins.join(', ')}`);
  logger.info(`==================================================`);
});

// ─── Graceful Shutdown ─────────────────────────────────────────────────────────
// Cuando el sistema operativo envía SIGTERM (Railway, Docker) o SIGINT (Ctrl+C),
// el servidor termina de procesar las peticiones en vuelo, cierra el pool de
// conexiones de PostgreSQL limpiamente y luego termina el proceso.
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

  // Fuerza el cierre si el apagado limpio tarda más de 10 segundos
  setTimeout(() => process.exit(1), 10000);
}

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
