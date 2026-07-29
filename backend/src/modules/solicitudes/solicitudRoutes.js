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

// Rutas de solicitudes y trámites
router.post('/', authMiddleware, requireRole('SUPERADMIN', 'ADMINISTRADOR', 'FUNCIONARIO'), validate(crearSolicitudSchema), registrarSolicitud);
router.get('/', authMiddleware, requireRole('SUPERADMIN', 'ADMINISTRADOR', 'FUNCIONARIO', 'ANALISTA'), validateQuery(listarQuerySchema), listarSolicitudes);
router.get('/stats', authMiddleware, requireRole('SUPERADMIN', 'ADMINISTRADOR', 'FUNCIONARIO', 'ANALISTA'), obtenerStats);
router.get('/productores', authMiddleware, requireRole('SUPERADMIN', 'ADMINISTRADOR', 'FUNCIONARIO', 'ANALISTA'), obtenerProductores);
router.get('/:id', authMiddleware, requireRole('SUPERADMIN', 'ADMINISTRADOR', 'FUNCIONARIO', 'ANALISTA'), validateParams(idParamSchema), obtenerSolicitud);
router.patch('/:id/estatus', authMiddleware, requireRole('SUPERADMIN', 'ADMINISTRADOR', 'FUNCIONARIO'), validateParams(idParamSchema), validate(actualizarEstatusSchema), actualizarEstatus);
router.patch('/:id/documentos', authMiddleware, requireRole('SUPERADMIN', 'ADMINISTRADOR', 'FUNCIONARIO'), validateParams(idParamSchema), validate(actualizarDocumentosSchema), actualizarDocumentos);

export default router;
