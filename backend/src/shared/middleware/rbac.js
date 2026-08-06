/**
 * ============================================================
 * Middleware RBAC — Control de Acceso Basado en Roles
 * (Role-Based Access Control)
 * ============================================================
 *
 * Permite restringir el acceso a endpoints específicos según el
 * rol del usuario autenticado.
 *
 * Jerarquía de roles del sistema SIRESA:
 *  - SUPERADMIN   → Acceso total al sistema
 *  - ADMINISTRADOR → Administración operativa (sin gestionar SUPERADMINs)
 *  - FUNCIONARIO  → Registro y seguimiento de expedientes
 *  - ANALISTA     → Solo consulta y visualización (sin escritura)
 *
 * Uso en rutas:
 *   router.post('/', authMiddleware, requireRole('ADMINISTRADOR', 'FUNCIONARIO'), handler);
 *   router.delete('/:id', authMiddleware, requireRole('SUPERADMIN'), handler);
 *
 * IMPORTANTE: Este middleware SIEMPRE debe ir después de authMiddleware,
 * ya que necesita que req.user esté disponible.
 */

export function requireRole(...allowedRoles) {
  return (req, res, next) => {
    // Si authMiddleware no puso al usuario en req.user, no está autenticado
    if (!req.user) {
      return res.status(401).json({ error: 'No autenticado. Por favor inicia sesión.' });
    }

    // Verificar que el rol del usuario está entre los roles permitidos para esta ruta
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        error: `Acceso denegado. Esta acción requiere uno de los siguientes roles: ${allowedRoles.join(', ')}.`
      });
    }

    // El usuario tiene el rol correcto, continuar con el siguiente middleware o controlador
    next();
  };
}
