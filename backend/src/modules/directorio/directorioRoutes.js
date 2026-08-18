/**
 * ============================================================
 * Módulo Geodirectorio — Rutas Backend
 * Secretaría de Desarrollo Rural de Nayarit
 * ============================================================
 */

import { Router } from 'express';
import { getGeodirectorioData } from './directorioController.js';
import { authMiddleware } from '../../shared/middleware/auth.js';

const router = Router();

// Todas las consultas geográficas requieren usuario autenticado
router.get('/geo', authMiddleware, getGeodirectorioData);

export default router;
