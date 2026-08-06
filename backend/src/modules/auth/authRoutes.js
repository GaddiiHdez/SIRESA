/**
 * ============================================================
 * Módulo de Autenticación — Rutas
 * ============================================================
 *
 * Define los endpoints públicos y protegidos del módulo auth.
 *
 * Rutas disponibles:
 *  POST /api/auth/login → Inicio de sesión con rate limiting
 *  GET  /api/auth/me    → Verificar sesión activa del usuario
 */

import { Router } from 'express';
import { login, me } from './authController.js';
import { authMiddleware } from '../../shared/middleware/auth.js';
import { validate } from '../../shared/middleware/validate.js';
import { loginSchema } from './authSchemas.js';
import rateLimit from 'express-rate-limit';

const router = Router();

// ─── Rate Limiting para Login ──────────────────────────────────────────────────
// Protección contra ataques de fuerza bruta (adivinar contraseñas por volumen).
// Limita a 5 intentos de login por IP en una ventana de 15 minutos.
// Si se superan los 5 intentos, devuelve 429 Too Many Requests.
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // Ventana de tiempo: 15 minutos
  max: 5,                    // Máximo de intentos permitidos por IP
  message: { error: 'Demasiados intentos de inicio de sesión. Intenta de nuevo en 15 minutos.' },
  standardHeaders: true,     // Incluir cabeceras RateLimit-* estándar en la respuesta
  legacyHeaders: false,      // No incluir cabeceras X-RateLimit-* antiguas
});

// POST /api/auth/login
// 1. loginLimiter → protección anti fuerza bruta
// 2. validate(loginSchema) → valida que username y password estén presentes
// 3. login → ejecuta la autenticación y devuelve el JWT
router.post('/login', loginLimiter, validate(loginSchema), login);

// GET /api/auth/me
// Requiere token válido → devuelve los datos del usuario autenticado
router.get('/me', authMiddleware, me);

export default router;
