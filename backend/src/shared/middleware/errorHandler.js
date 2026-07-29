import logger from '../utils/logger.js';

/**
 * Middleware global de manejo de errores para Express.
 * Captura todos los errores no manejados y devuelve respuestas seguras
 * sin filtrar stack traces ni información interna al cliente.
 */

// Manejador de rutas no encontradas
export function notFoundHandler(req, res, _next) {
  res.status(404).json({
    error: 'Recurso no encontrado.',
    path: req.originalUrl
  });
}

// Manejador global de errores
export function errorHandler(err, _req, res, _next) {
  // Log estructurado interno (nunca se envía al cliente)
  logger.error(err.message, {
    stack: err.stack,
    name: err.name,
    code: err.code
  });

  // Errores de validación de Prisma
  if (err.code === 'P2002') {
    return res.status(409).json({
      error: 'Ya existe un registro con esos datos. Verifica e intenta de nuevo.'
    });
  }

  if (err.code === 'P2025') {
    return res.status(404).json({
      error: 'El registro solicitado no fue encontrado.'
    });
  }

  // Errores de validación de Zod (se establecen en el validate middleware)
  if (err.name === 'ZodError') {
    return res.status(400).json({
      error: 'Error de validación.',
      detalles: err.errors?.map(e => ({
        campo: e.path.join('.'),
        mensaje: e.message
      }))
    });
  }

  // Error de CORS
  if (err.message?.includes('CORS')) {
    return res.status(403).json({ error: 'Origen no permitido.' });
  }

  // Error genérico — NO filtrar detalles internos al cliente
  const statusCode = err.statusCode || 500;
  res.status(statusCode).json({
    error: statusCode === 500
      ? 'Error interno del servidor. Intenta más tarde.'
      : err.message
  });
}
