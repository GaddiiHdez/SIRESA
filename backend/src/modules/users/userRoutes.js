import { Router } from 'express';
import { getUsers, createUser, updateUser, deleteUser } from './userController.js';
import { authMiddleware } from '../../shared/middleware/auth.js';
import { requireRole } from '../../shared/middleware/rbac.js';
import { validate } from '../../shared/middleware/validate.js';
import { createUserSchema, updateUserSchema } from './userSchemas.js';

const router = Router();

// Todas las rutas de usuarios requieren autenticación y rol de ADMINISTRADOR o SUPERADMIN
router.use(authMiddleware);
router.use(requireRole('SUPERADMIN', 'ADMINISTRADOR'));

router.get('/', getUsers);
router.post('/', validate(createUserSchema), createUser);
router.put('/:id', validate(updateUserSchema), updateUser);
router.delete('/:id', deleteUser);

export default router;
