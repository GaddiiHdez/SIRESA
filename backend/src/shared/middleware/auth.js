/**
 * ============================================================
 * Middleware de Autenticación — JWT (JSON Web Token)
 * ============================================================
 *
 * Este middleware protege las rutas que requieren sesión activa.
 *
 * Flujo:
 *  1. El cliente envía el token en el header: Authorization: Bearer <token>
 *  2. Se extrae el token del header
 *  3. Se verifica la firma del token con JWT_SECRET
 *  4. Si es válido, se adjunta el usuario decodificado a req.user
 *     para que los controladores y middlewares RBAC puedan usarlo
 *  5. Si el token está expirado o es inválido → 403 Forbidden
 *
 * Uso en rutas:
 *   router.get('/ruta', authMiddleware, miControlador);
 */

import jwt from 'jsonwebtoken';

// Clave secreta para firmar y verificar tokens JWT.
// DEBE estar definida como variable de entorno en producción.
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  console.error('CRITICAL: JWT_SECRET no está configurado en las variables de entorno.');
}

export function authMiddleware(req, res, next) {
  // Verificar que el header Authorization existe y tiene el formato correcto
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Acceso denegado. No se proporcionó token de autenticación.' });
    return;
  }

  // Extraer solo el token (quitar el prefijo "Bearer ")
  const token = authHeader.split(' ')[1];

  try {
    // Verificar y decodificar el token. Lanza excepción si expiró o la firma no coincide.
    const decoded = jwt.verify(token, JWT_SECRET);

    // Adjuntar el payload del token (id, username, role, name) a la petición
    // para que los controladores y el middleware RBAC puedan acceder al usuario actual
    req.user = decoded;
    next();
  } catch (error) {
    // El token es inválido (manipulado) o ya expiró (tokens duran 8 horas)
    res.status(403).json({ error: 'Token inválido o sesión expirada. Por favor inicia sesión de nuevo.' });
  }
}
