/**
 * ============================================================
 * Módulo de Reportes Ejecutivos — Rutas (SEDER Nayarit)
 * ============================================================
 */

import { Router } from 'express';
import { getReporteEjecutivo } from './reporteController.js';
import { authMiddleware } from '../../shared/middleware/auth.js';
import { requireRole } from '../../shared/middleware/rbac.js';

const router = Router();

// Accesible para todos los usuarios autenticados
router.use(authMiddleware);
router.use(requireRole('SUPERADMIN', 'ADMINISTRADOR', 'FUNCIONARIO', 'ANALISTA'));

router.get('/ejecutivo', getReporteEjecutivo);

export default router;
