/**
 * ============================================================
 * Módulo de Autenticación — Controlador
 * ============================================================
 *
 * Maneja las operaciones de inicio de sesión y verificación
 * de la sesión activa del usuario.
 *
 * Endpoints que usa este controlador:
 *  POST /api/auth/login → login()
 *  GET  /api/auth/me    → me()
 */

import prisma from '../../shared/config/db.js';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import logger from '../../shared/utils/logger.js';
import { registrarAuditoria } from '../../shared/services/auditService.js';

// Clave secreta para firmar los tokens JWT.
// DEBE coincidir con la usada en el middleware de autenticación.
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  logger.error('CRITICAL: JWT_SECRET no está configurado en las variables de entorno. El servidor operará en modo inseguro.');
}

/**
 * POST /api/auth/login
 *
 * Flujo de autenticación:
 *  1. Recibir username y password del cuerpo de la petición
 *  2. Buscar el usuario en la base de datos por username
 *  3. Comparar la contraseña con el hash bcrypt almacenado
 *  4. Si coincide, generar y devolver un token JWT con los datos del usuario
 *
 * El token JWT contiene: id, username, role, name
 * y expira en 8 horas (tiempo de jornada laboral estándar).
 */
export async function login(req, res) {
  const { username, password } = req.body;

  // Validación básica: ambos campos son requeridos
  if (!username || !password) {
    res.status(400).json({ error: 'Usuario y contraseña son requeridos.' });
    return;
  }

  try {
    // Buscar el usuario en la base de datos (búsqueda exacta por username)
    const user = await prisma.user.findUnique({
      where: { username },
    });

    // Usuario no encontrado — devolver el mismo mensaje que "contraseña incorrecta"
    // para no revelar si el username existe o no (seguridad por oscuridad)
    if (!user) {
      res.status(401).json({ error: 'Credenciales inválidas.' });
      return;
    }

    // Comparar la contraseña ingresada con el hash bcrypt almacenado en BD
    // bcrypt.compare es resistente a timing attacks
    const isMatch = await bcrypt.compare(password, user.passwordHash);

    if (!isMatch) {
      res.status(401).json({ error: 'Credenciales inválidas.' });
      return;
    }

    // Asegurar que el usuario 'admin' siempre tiene el rol SUPERADMIN.
    // Esto corrige casos donde el seed pueda haberlo creado con otro rol.
    let effectiveRole = user.role;
    if (user.username === 'admin' && user.role !== 'SUPERADMIN') {
      effectiveRole = 'SUPERADMIN';
      await prisma.user.update({
        where: { id: user.id },
        data: { role: 'SUPERADMIN' }
      }).catch(err => logger.warn('Error al actualizar rol efectivo de admin:', { error: err.message }));
    }

    // Generar el token JWT firmado con la clave secreta.
    // El payload incluye los datos necesarios para autorizción y UI.
    const token = jwt.sign(
      {
        id: user.id,
        username: user.username,
        role: effectiveRole,
        name: user.name,
      },
      JWT_SECRET,
      { expiresIn: '10h' }  // El token expira después de 10 horas (jornada laboral completa)
    );

    // Registrar en la bitácora de auditoría
    registrarAuditoria({
      accion: 'LOGIN',
      modulo: 'AUTH',
      detalles: `Inicio de sesión exitoso de @${user.username} (${effectiveRole})`,
      req,
      usuarioId: user.id,
      username: user.username,
      userRole: effectiveRole
    });

    // Devolver el token y los datos básicos del usuario al cliente
    res.json({
      token,
      user: {
        id: user.id,
        username: user.username,
        role: effectiveRole,
        name: user.name,
      },
    });
  } catch (error) {
    logger.error('Error en login:', { error: error.message });
    res.status(500).json({ error: 'Error interno del servidor.' });
  }
}

/**
 * GET /api/auth/me
 *
 * Devuelve los datos del usuario actualmente autenticado.
 * El middleware authMiddleware ya validó el token y puso
 * el usuario en req.user antes de llegar aquí.
 *
 * Útil para que el frontend verifique si la sesión sigue activa
 * al recargar la página.
 */
export async function me(req, res) {
  if (!req.user) {
    res.status(401).json({ error: 'No autenticado.' });
    return;
  }
  res.json({ user: req.user });
}
