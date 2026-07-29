/**
 * Middleware de Control de Acceso Basado en Roles (RBAC).
 * Verifica que el usuario autenticado tenga uno de los roles permitidos.
 * 
 * Uso en rutas:
 *   router.post('/', authMiddleware, requireRole('ADMINISTRADOR', 'FUNCIONARIO'), handler);
 *   router.delete('/:id', authMiddleware, requireRole('ADMINISTRADOR'), handler);
 */

export function requireRole(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'No autenticado.' });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        error: 'No tienes permisos para realizar esta acción.'
      });
    }

    next();
  };
}
