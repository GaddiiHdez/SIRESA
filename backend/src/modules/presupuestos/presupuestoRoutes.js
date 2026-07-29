import { Router } from 'express';
import { actualizarPresupuesto } from './presupuestoController.js';
import { authMiddleware } from '../../shared/middleware/auth.js';
import { requireRole } from '../../shared/middleware/rbac.js';

const router = Router();

// PATCH / PUT /api/presupuestos - Accesible para SuperAdmin y Administrador
router.patch('/', authMiddleware, requireRole('SUPERADMIN', 'ADMINISTRADOR'), actualizarPresupuesto);
router.put('/', authMiddleware, requireRole('SUPERADMIN', 'ADMINISTRADOR'), actualizarPresupuesto);

export default router;
