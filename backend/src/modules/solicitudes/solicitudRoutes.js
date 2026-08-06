/**
 * ============================================================
 * Módulo de Solicitudes — Rutas
 * ============================================================
 *
 * Define los endpoints del módulo de expedientes y solicitudes
 * con sus capas de seguridad: autenticación, roles y validación.
 *
 * Todas las rutas requieren autenticación JWT.
 * Los roles determinan qué operaciones puede hacer cada usuario:
 *
 *  Lectura (GET):    SUPERADMIN, ADMINISTRADOR, FUNCIONARIO, ANALISTA
 *  Escritura (POST/PATCH): SUPERADMIN, ADMINISTRADOR, FUNCIONARIO
 */

import { Router } from 'express';
import {
  registrarSolicitud,
  listarSolicitudes,
  obtenerSolicitud,
  actualizarEstatus,
  actualizarDocumentos,
  obtenerStats,
  obtenerProductores
} from './solicitudController.js';
import { authMiddleware } from '../../shared/middleware/auth.js';
import { validate, validateParams, validateQuery } from '../../shared/middleware/validate.js';
import { requireRole } from '../../shared/middleware/rbac.js';
import {
  crearSolicitudSchema,
  actualizarEstatusSchema,
  actualizarDocumentosSchema,
  idParamSchema,
  listarQuerySchema
} from './solicitudSchemas.js';

const router = Router();

// ─── Endpoints de Escritura ────────────────────────────────────────────────────

// Registrar nuevo expediente (FUNCIONARIO y superiores)
router.post('/',
  authMiddleware,
  requireRole('SUPERADMIN', 'ADMINISTRADOR', 'FUNCIONARIO'),
  validate(crearSolicitudSchema),
  registrarSolicitud
);

// Cambiar estatus de un expediente (FUNCIONARIO y superiores)
router.patch('/:id/estatus',
  authMiddleware,
  requireRole('SUPERADMIN', 'ADMINISTRADOR', 'FUNCIONARIO'),
  validateParams(idParamSchema),
  validate(actualizarEstatusSchema),
  actualizarEstatus
);

// Actualizar URLs de documentos de un expediente (FUNCIONARIO y superiores)
router.patch('/:id/documentos',
  authMiddleware,
  requireRole('SUPERADMIN', 'ADMINISTRADOR', 'FUNCIONARIO'),
  validateParams(idParamSchema),
  validate(actualizarDocumentosSchema),
  actualizarDocumentos
);

// ─── Endpoints de Solo Lectura ────────────────────────────────────────────────

// Listar expedientes con filtros y paginación (todos los roles)
router.get('/',
  authMiddleware,
  requireRole('SUPERADMIN', 'ADMINISTRADOR', 'FUNCIONARIO', 'ANALISTA'),
  validateQuery(listarQuerySchema),
  listarSolicitudes
);

// Estadísticas del dashboard (todos los roles)
router.get('/stats',
  authMiddleware,
  requireRole('SUPERADMIN', 'ADMINISTRADOR', 'FUNCIONARIO', 'ANALISTA'),
  obtenerStats
);

// Padrón de productores (todos los roles)
router.get('/productores',
  authMiddleware,
  requireRole('SUPERADMIN', 'ADMINISTRADOR', 'FUNCIONARIO', 'ANALISTA'),
  obtenerProductores
);

// Detalle de un expediente por ID (todos los roles)
router.get('/:id',
  authMiddleware,
  requireRole('SUPERADMIN', 'ADMINISTRADOR', 'FUNCIONARIO', 'ANALISTA'),
  validateParams(idParamSchema),
  obtenerSolicitud
);

export default router;
