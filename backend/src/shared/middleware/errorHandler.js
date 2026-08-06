/**
 * ============================================================
 * Manejadores Globales de Errores HTTP
 * ============================================================
 *
 * Express requiere dos tipos de manejadores especiales al final
 * de la cadena de middlewares:
 *
 *  1. notFoundHandler → Maneja rutas que no existen (404)
 *  2. errorHandler    → Captura CUALQUIER error lanzado en
 *                       controladores o middlewares anteriores
 *
 * Principios de diseño:
 *  - NUNCA enviar stack traces, nombres de módulos internos
 *    ni rutas del sistema al cliente (información sensible)
 *  - Loggear TODA la información internamente para diagnóstico
 *  - Respuestas al cliente siempre en formato JSON estándar
 */

import logger from '../utils/logger.js';

// ─── 404 — Ruta No Encontrada ──────────────────────────────────────────────────
/**
 * Se registra ANTES del errorHandler en server.js.
 * Si ninguna ruta coincidió con la petición, Express llega aquí.
 */
export function notFoundHandler(req, res, _next) {
  res.status(404).json({
    error: 'Recurso no encontrado.',
    path: req.originalUrl  // Informar qué ruta intentó acceder el cliente
  });
}

// ─── Manejador Global de Errores ───────────────────────────────────────────────
/**
 * Express identifica este middleware como manejador de errores porque recibe
 * 4 parámetros (err, req, res, next). Se llama automáticamente cuando
 * un controlador hace: next(error) o lanza una excepción.
 */
export function errorHandler(err, _req, res, _next) {
  // Registrar el error completo con stack trace en los logs del servidor
  // (nunca se envía al cliente)
  logger.error(err.message, {
    stack: err.stack,
    name: err.name,
    code: err.code
  });

  // ── Errores conocidos de Prisma (ORM de base de datos) ────────────────────────

  // P2002: Violación de restricción UNIQUE (ej: username ya existe)
  if (err.code === 'P2002') {
    return res.status(409).json({
      error: 'Ya existe un registro con esos datos. Verifica e intenta de nuevo.'
    });
  }

  // P2025: Registro no encontrado al intentar actualizar o eliminar
  if (err.code === 'P2025') {
    return res.status(404).json({
      error: 'El registro solicitado no fue encontrado.'
    });
  }

  // ── Errores de validación Zod ─────────────────────────────────────────────────
  // (generalmente manejados en validate.js, pero por si acaso llegan aquí)
  if (err.name === 'ZodError') {
    return res.status(400).json({
      error: 'Error de validación.',
      detalles: err.errors?.map(e => ({
        campo: e.path.join('.'),
        mensaje: e.message
      }))
    });
  }

  // ── Errores de CORS ───────────────────────────────────────────────────────────
  if (err.message?.includes('CORS')) {
    return res.status(403).json({ error: 'Origen de solicitud no permitido.' });
  }

  // ── Error genérico (500) ──────────────────────────────────────────────────────
  // Para errores internos desconocidos, NO revelar detalles técnicos al cliente.
  // El statusCode personalizado permite que los controladores devuelvan
  // errores con códigos específicos (ej: err.statusCode = 422)
  const statusCode = err.statusCode || 500;
  res.status(statusCode).json({
    error: statusCode === 500
      ? 'Error interno del servidor. Por favor intenta más tarde.'
      : err.message
  });
}
