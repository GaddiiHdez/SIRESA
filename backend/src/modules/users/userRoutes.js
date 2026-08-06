/**
 * ============================================================
 * Módulo de Usuarios — Rutas
 * ============================================================
 *
 * Todas las rutas de este módulo están protegidas:
 *  - Requieren autenticación válida (JWT)
 *  - Solo accesibles para roles SUPERADMIN y ADMINISTRADOR
 *
 * El middleware se aplica a nivel de router (router.use) para
 * no repetirlo en cada ruta individual.
 *
 * Rutas disponibles:
 *  GET    /api/users/       → Listar todos los usuarios
 *  POST   /api/users/       → Crear usuario (con validación de schema)
 *  PUT    /api/users/:id    → Actualizar usuario (con validación de schema)
 *  DELETE /api/users/:id    → Eliminar usuario
 */

import { Router } from 'express';
import { getUsers, createUser, updateUser, deleteUser } from './userController.js';
import { authMiddleware } from '../../shared/middleware/auth.js';
import { requireRole } from '../../shared/middleware/rbac.js';
import { validate } from '../../shared/middleware/validate.js';
import { createUserSchema, updateUserSchema } from './userSchemas.js';

const router = Router();

// Aplicar autenticación y restricción de roles a TODAS las rutas de este módulo.
// FUNCIONARIO y ANALISTA no pueden acceder a ningún endpoint de gestión de usuarios.
router.use(authMiddleware);
router.use(requireRole('SUPERADMIN', 'ADMINISTRADOR'));

router.get('/', getUsers);                              // Listar usuarios
router.post('/', validate(createUserSchema), createUser); // Crear usuario (valida body)
router.put('/:id', validate(updateUserSchema), updateUser); // Actualizar usuario (valida body)
router.delete('/:id', deleteUser);                     // Eliminar usuario

export default router;
