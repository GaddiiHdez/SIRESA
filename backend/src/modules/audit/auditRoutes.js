/**
 * ============================================================
 * Módulo de Auditoría Forense — Rutas (SUPERADMIN)
 * ============================================================
 */

import { Router } from 'express';
import { getAuditLogs, getAuditStats } from './auditController.js';
import { authMiddleware } from '../../shared/middleware/auth.js';
import { requireRole } from '../../shared/middleware/rbac.js';

const router = Router();

// Todas las rutas de auditoría están estrictamente restringidas a SUPERADMIN
router.use(authMiddleware);
router.use(requireRole('SUPERADMIN'));

router.get('/', getAuditLogs);
router.get('/stats', getAuditStats);

export default router;
