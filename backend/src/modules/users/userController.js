import prisma from '../../shared/config/db.js';
import bcrypt from 'bcrypt';

/**
 * Obtener todos los usuarios (excluyendo passwordHash)
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
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json(users);
  } catch (error) {
    console.error('Error al obtener usuarios:', error);
    res.status(500).json({ error: 'Error interno del servidor al consultar usuarios.' });
  }
}

/**
 * Crear un nuevo usuario
 */
export async function createUser(req, res) {
  const { username, password, name, role } = req.body;
  const currentRole = req.user.role;

  // Regla de Jerarquía: Solo SUPERADMIN puede crear otro SUPERADMIN
  if (role === 'SUPERADMIN' && currentRole !== 'SUPERADMIN') {
    res.status(403).json({ error: 'Solo un Super Administrador puede crear usuarios con el rol SUPERADMIN.' });
    return;
  }

  try {
    const existing = await prisma.user.findUnique({
      where: { username: username.toLowerCase().trim() },
    });

    if (existing) {
      res.status(400).json({ error: `El nombre de usuario '${username}' ya está registrado.` });
      return;
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const newUser = await prisma.user.create({
      data: {
        username: username.toLowerCase().trim(),
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
      },
    });

    res.status(201).json(newUser);
  } catch (error) {
    console.error('Error al crear usuario:', error);
    res.status(500).json({ error: 'Error interno del servidor al crear usuario.' });
  }
}

/**
 * Actualizar datos de un usuario
 */
export async function updateUser(req, res) {
  const { id } = req.params;
  const { username, password, name, role } = req.body;
  const currentUserId = req.user.id;
  const currentRole = req.user.role;

  try {
    const targetUser = await prisma.user.findUnique({ where: { id } });

    if (!targetUser) {
      res.status(404).json({ error: 'Usuario no encontrado.' });
      return;
    }

    // Regla de Jerarquía: Nadie puede modificar a un SUPERADMIN salvo otro SUPERADMIN
    const isTargetSuperAdmin = targetUser.role === 'SUPERADMIN' || targetUser.username === 'admin';
    if (isTargetSuperAdmin && currentRole !== 'SUPERADMIN') {
      res.status(403).json({ error: 'No tienes permisos para modificar la cuenta de un Super Administrador.' });
      return;
    }

    // Regla de Promoción: Solo SUPERADMIN puede asignar el rol SUPERADMIN
    if (role === 'SUPERADMIN' && currentRole !== 'SUPERADMIN') {
      res.status(403).json({ error: 'Solo un Super Administrador puede otorgar el rol SUPERADMIN.' });
      return;
    }

    // Regla de Auto-modificación de Rol: No puedes quitarte tu propio rol
    if (targetUser.id === currentUserId && role && role !== targetUser.role) {
      res.status(400).json({ error: 'No puedes cambiar tu propio rol en la sesión activa.' });
      return;
    }

    // Validar nombre de usuario único si cambió
    if (username && username.toLowerCase().trim() !== targetUser.username) {
      const existing = await prisma.user.findUnique({
        where: { username: username.toLowerCase().trim() },
      });
      if (existing) {
        res.status(400).json({ error: `El usuario '${username}' ya pertenece a otra cuenta.` });
        return;
      }
    }

    const updateData = {};
    if (username) updateData.username = username.toLowerCase().trim();
    if (name) updateData.name = name.trim();
    if (role) updateData.role = role;

    // Si se especificó una nueva contraseña, generar hash
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
    console.error('Error al actualizar usuario:', error);
    res.status(500).json({ error: 'Error interno al actualizar usuario.' });
  }
}

/**
 * Eliminar un usuario
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

    // Regla de Protección Personal: No se puede eliminar a uno mismo
    if (targetUser.id === currentUserId) {
      res.status(400).json({ error: 'No puedes eliminar tu propia cuenta activa.' });
      return;
    }

    // Regla de Jerarquía: Nadie puede eliminar a un SUPERADMIN salvo otro SUPERADMIN (y el admin principal 'admin' es intocable)
    const isTargetSuperAdmin = targetUser.role === 'SUPERADMIN' || targetUser.username === 'admin';
    if (isTargetSuperAdmin && currentRole !== 'SUPERADMIN') {
      res.status(403).json({ error: 'No tienes permisos para eliminar a un Super Administrador.' });
      return;
    }

    // Protección adicional: El usuario principal de sistema 'admin' nunca se puede eliminar por nadie
    if (targetUser.username === 'admin') {
      res.status(403).json({ error: 'El usuario principal del sistema (admin) es permanente y no se puede eliminar.' });
      return;
    }

    await prisma.user.delete({ where: { id } });

    res.json({ message: `Usuario ${targetUser.username} eliminado correctamente.` });
  } catch (error) {
    console.error('Error al eliminar usuario:', error);
    res.status(500).json({ error: 'Error interno al eliminar usuario.' });
  }
}
