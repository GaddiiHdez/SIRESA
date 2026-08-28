/**
 * ============================================================
 * Módulo de Usuarios — Controlador
 * ============================================================
 *
 * Maneja el CRUD de usuarios del sistema con reglas de jerarquía
 * de roles para proteger cuentas privilegiadas.
 *
 * Endpoints:
 *  GET    /api/users/       → getUsers()    — Listar todos los usuarios
 *  POST   /api/users/       → createUser()  — Crear nuevo usuario
 *  PUT    /api/users/:id    → updateUser()  — Actualizar datos de un usuario
 *  DELETE /api/users/:id    → deleteUser()  — Eliminar un usuario
 *
 * Reglas de jerarquía aplicadas:
 *  - Solo SUPERADMIN puede crear o modificar otros SUPERADMINs
 *  - Nadie puede eliminar al usuario 'admin' (cuenta raíz del sistema)
 *  - Un usuario no puede cambiar su propio rol en la sesión activa
 *  - Un usuario no puede eliminarse a sí mismo
 */

import prisma from '../../shared/config/db.js';
import bcrypt from 'bcrypt';
import logger from '../../shared/utils/logger.js';

/**
 * GET /api/users/
 *
 * Devuelve la lista de todos los usuarios del sistema.
 * El campo passwordHash NUNCA se incluye en la respuesta (seguridad).
 */
export async function getUsers(req, res) {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        username: true,
        name: true,
        role: true,
        createdAt: true,
        updatedAt: true,
        // passwordHash: false → omitido intencionalmente por seguridad
      },
      orderBy: { createdAt: 'desc' }, // Los más recientes primero
    });
    res.json(users);
  } catch (error) {
    logger.error('Error al obtener usuarios', { error: error.message });
    res.status(500).json({ error: 'Error interno del servidor al consultar usuarios.' });
  }
}

/**
 * POST /api/users/
 *
 * Crea un nuevo usuario en el sistema.
 * La contraseña se hashea con bcrypt (factor de costo 12) antes de guardarla.
 *
 * Reglas:
 *  - Solo SUPERADMIN puede crear usuarios con rol SUPERADMIN
 *  - El username se normaliza a minúsculas y sin espacios
 */
export async function createUser(req, res) {
  const { username, password, name, role } = req.body;
  const currentRole = req.user.role; // Rol del usuario que hace la petición

  // REGLA DE JERARQUÍA: Impedir que un ADMINISTRADOR cree otro SUPERADMIN
  if (role === 'SUPERADMIN' && currentRole !== 'SUPERADMIN') {
    res.status(403).json({ error: 'Solo un Super Administrador puede crear usuarios con el rol SUPERADMIN.' });
    return;
  }

  try {
    // Verificar que el nombre de usuario no esté ya registrado (es UNIQUE en BD)
    const existing = await prisma.user.findUnique({
      where: { username: username.toLowerCase().trim() },
    });

    if (existing) {
      res.status(400).json({ error: `El nombre de usuario '${username}' ya está registrado.` });
      return;
    }

    // Hashear la contraseña con bcrypt (costo 12 = balance seguridad/velocidad)
    // Nunca se guarda la contraseña en texto claro
    const passwordHash = await bcrypt.hash(password, 12);

    const newUser = await prisma.user.create({
      data: {
        username: username.toLowerCase().trim(), // Normalizar a minúsculas
        passwordHash,
        name,
        role,
      },
      select: {
        id: true,
        username: true,
        name: true,
        role: true,
        createdAt: true,
        updatedAt: true,
        // passwordHash omitido de la respuesta
      },
    });

    res.status(201).json(newUser);
  } catch (error) {
    logger.error('Error al crear usuario', { error: error.message });
    res.status(500).json({ error: 'Error interno del servidor al crear usuario.' });
  }
}

/**
 * PUT /api/users/:id
 *
 * Actualiza los datos de un usuario existente.
 * Si se envía una nueva contraseña, se rehashea con bcrypt.
 * Si no se envía contraseña, la actual se mantiene sin cambios.
 *
 * Reglas de protección:
 *  - Nadie (salvo otro SUPERADMIN) puede modificar a un SUPERADMIN
 *  - Solo SUPERADMIN puede asignar el rol SUPERADMIN a otro usuario
 *  - Un usuario no puede cambiar su propio rol activo
 */
export async function updateUser(req, res) {
  const { id } = req.params;
  const { username, password, name, role } = req.body;
  const currentUserId = req.user.id;     // ID del usuario que hace la petición
  const currentRole = req.user.role;     // Rol del usuario que hace la petición

  try {
    // Obtener el usuario objetivo de la base de datos
    const targetUser = await prisma.user.findUnique({ where: { id } });

    if (!targetUser) {
      res.status(404).json({ error: 'Usuario no encontrado.' });
      return;
    }

    // REGLA: Nadie puede modificar a un SUPERADMIN salvo otro SUPERADMIN
    const isTargetSuperAdmin = targetUser.role === 'SUPERADMIN' || targetUser.username === 'admin';
    if (isTargetSuperAdmin && currentRole !== 'SUPERADMIN') {
      res.status(403).json({ error: 'No tienes permisos para modificar la cuenta de un Super Administrador.' });
      return;
    }

    // REGLA: Solo SUPERADMIN puede promover a alguien a SUPERADMIN
    if (role === 'SUPERADMIN' && currentRole !== 'SUPERADMIN') {
      res.status(403).json({ error: 'Solo un Super Administrador puede otorgar el rol SUPERADMIN.' });
      return;
    }

    // REGLA: Un usuario no puede cambiar su propio rol mientras tiene sesión activa
    // (evita que accidentalmente se quite permisos a sí mismo)
    if (targetUser.id === currentUserId && role && role !== targetUser.role) {
      res.status(400).json({ error: 'No puedes cambiar tu propio rol en la sesión activa.' });
      return;
    }

    // Verificar unicidad del username si fue modificado
    if (username && username.toLowerCase().trim() !== targetUser.username) {
      const existing = await prisma.user.findUnique({
        where: { username: username.toLowerCase().trim() },
      });
      if (existing) {
        res.status(400).json({ error: `El usuario '${username}' ya pertenece a otra cuenta.` });
        return;
      }
    }

    // Construir el objeto de actualización solo con los campos que llegaron
    const updateData = {};
    if (username) updateData.username = username.toLowerCase().trim();
    if (name) updateData.name = name.trim();
    if (role) updateData.role = role;

    // Si se proporcionó una nueva contraseña no vacía, hashearla
    if (password && password.trim() !== '') {
      updateData.passwordHash = await bcrypt.hash(password, 12);
    }

    const updatedUser = await prisma.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        username: true,
        name: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    res.json(updatedUser);
  } catch (error) {
    logger.error('Error al actualizar usuario', { error: error.message });
    res.status(500).json({ error: 'Error interno al actualizar usuario.' });
  }
}

/**
 * DELETE /api/users/:id
 *
 * Elimina permanentemente un usuario del sistema.
 *
 * Reglas de protección:
 *  - Un usuario no puede eliminarse a sí mismo
 *  - Nadie puede eliminar al usuario 'admin' (cuenta raíz intocable)
 *  - Solo SUPERADMIN puede eliminar a otros SUPERADMINs
 */
export async function deleteUser(req, res) {
  const { id } = req.params;
  const currentUserId = req.user.id;
  const currentRole = req.user.role;

  try {
    const targetUser = await prisma.user.findUnique({ where: { id } });

    if (!targetUser) {
      res.status(404).json({ error: 'Usuario no encontrado.' });
      return;
    }

    // REGLA: Auto-protección — nadie puede eliminar su propia cuenta activa
    if (targetUser.id === currentUserId) {
      res.status(400).json({ error: 'No puedes eliminar tu propia cuenta activa.' });
      return;
    }

    // REGLA: Solo SUPERADMIN puede eliminar a otro SUPERADMIN
    const isTargetSuperAdmin = targetUser.role === 'SUPERADMIN' || targetUser.username === 'admin';
    if (isTargetSuperAdmin && currentRole !== 'SUPERADMIN') {
      res.status(403).json({ error: 'No tienes permisos para eliminar a un Super Administrador.' });
      return;
    }

    // REGLA ABSOLUTA: El usuario 'admin' (cuenta raíz del sistema) es permanente
    // y no puede ser eliminado por nadie, ni siquiera por otro SUPERADMIN
    if (targetUser.username === 'admin') {
      res.status(403).json({ error: 'El usuario principal del sistema (admin) es permanente y no se puede eliminar.' });
      return;
    }

    await prisma.user.delete({ where: { id } });

    res.json({ message: `Usuario '${targetUser.username}' eliminado correctamente.` });
  } catch (error) {
    logger.error('Error al eliminar usuario', { error: error.message });
    res.status(500).json({ error: 'Error interno al eliminar usuario.' });
  }
}
