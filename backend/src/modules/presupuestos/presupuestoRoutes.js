/**
 * ============================================================
 * Módulo de Presupuestos — Rutas
 * ============================================================
 *
 * Endpoints para gestionar los presupuestos sectoriales.
 * Solo accesibles para SUPERADMIN y ADMINISTRADOR.
 *
 * Rutas:
 *  PATCH /api/presupuestos/ → Actualizar presupuesto de un sector
 *  PUT   /api/presupuestos/ → Alias para PATCH (mismo controlador)
 */

import { Router } from 'express';
import { actualizarPresupuesto } from './presupuestoController.js';
import { authMiddleware } from '../../shared/middleware/auth.js';
import { requireRole } from '../../shared/middleware/rbac.js';

const router = Router();

// PATCH y PUT apuntan al mismo controlador.
// Se soportan ambos verbos HTTP para compatibilidad con diferentes clientes.
// Solo SUPERADMIN y ADMINISTRADOR pueden modificar presupuestos.
router.patch('/', authMiddleware, requireRole('SUPERADMIN', 'ADMINISTRADOR'), actualizarPresupuesto);
router.put('/', authMiddleware, requireRole('SUPERADMIN', 'ADMINISTRADOR'), actualizarPresupuesto);

export default router;
