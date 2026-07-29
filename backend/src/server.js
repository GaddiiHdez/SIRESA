import path from 'path';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import * as dotenv from 'dotenv';
import authRoutes from './modules/auth/authRoutes.js';
import catalogoRoutes from './modules/catalogos/catalogoRoutes.js';
import solicitudRoutes from './modules/solicitudes/solicitudRoutes.js';
import uploadRoutes from './modules/upload/uploadRoutes.js';
import presupuestoRoutes from './modules/presupuestos/presupuestoRoutes.js';
import userRoutes from './modules/users/userRoutes.js';
import { errorHandler, notFoundHandler } from './shared/middleware/errorHandler.js';
import { pool } from './shared/config/db.js';
import logger from './shared/utils/logger.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// ─── Seguridad ─────────────────────────────────────────────
// Desactivar crossOriginResourcePolicy para permitir que el frontend lea estáticos de la API
app.use(helmet({
  crossOriginResourcePolicy: false
}));

// CORS restrictivo / flexible: permite orígenes específicos, vercel y wildcards
const allowedOrigins = (process.env.CORS_ORIGINS || 'http://localhost:5173')
  .split(',')
  .map(o => o.trim());

app.use(cors({
  origin: (origin, callback) => {
    // Permitir requests sin origin (Postman, mobile, health checks)
    if (!origin) return callback(null, true);
    
    // Si CORS_ORIGINS incluye '*', permitir cualquier origen
    if (allowedOrigins.includes('*')) return callback(null, true);

    // Si coincide con la lista o proviene de vercel.app
    if (allowedOrigins.includes(origin) || origin.endsWith('.vercel.app')) {
      return callback(null, true);
    }
    
    callback(new Error(`Origen ${origin} no permitido por CORS.`));
  },
  credentials: true
}));

// Limitar tamaño de body para prevenir ataques DoS con payloads grandes
app.use(express.json({ limit: '1mb' }));

// ─── Rutas ─────────────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/catalogos', catalogoRoutes);
app.use('/api/solicitudes', solicitudRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/presupuestos', presupuestoRoutes);
app.use('/api/users', userRoutes);

// Servir la carpeta de subidas de forma estática para visualización
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date(), message: 'Servidor del Sistema de Solicitudes Nayarit operando correctamente.' });
});

// ─── Manejo de Errores ─────────────────────────────────────
app.use(notFoundHandler);
app.use(errorHandler);

// ─── Graceful Shutdown ─────────────────────────────────────
const server = app.listen(PORT, () => {
  logger.info(`==================================================`);
  logger.info(` Servidor de Desarrollo Rural Nayarit en ejecución`);
  logger.info(` - Puerto: ${PORT}`);
  logger.info(` - URL local: http://localhost:${PORT}`);
  logger.info(` - CORS: ${allowedOrigins.join(', ')}`);
  logger.info(`==================================================`);
});

function gracefulShutdown(signal) {
  logger.info(`${signal} recibido. Cerrando servidor HTTP...`);
  server.close(async () => {
    try {
      await pool.end();
      logger.info('Pool de conexiones de base de datos cerrado.');
    } catch (err) {
      logger.error('Error al cerrar el pool de conexiones de base de datos:', err);
    }
    logger.info('Servidor cerrado correctamente.');
    process.exit(0);
  });
  // Forzar cierre si tarda más de 10 segundos
  setTimeout(() => process.exit(1), 10000);
}

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
