import { z } from 'zod';

export const createUserSchema = z.object({
  username: z
    .string({ required_error: 'El nombre de usuario es requerido.' })
    .min(3, 'El nombre de usuario debe tener al menos 3 caracteres.')
    .max(50, 'El nombre de usuario no puede exceder 50 caracteres.')
    .trim(),
  password: z
    .string({ required_error: 'La contraseña es requerida.' })
    .min(6, 'La contraseña debe tener al menos 6 caracteres.')
    .max(128, 'La contraseña no puede exceder 128 caracteres.'),
  name: z
    .string({ required_error: 'El nombre completo es requerido.' })
    .min(2, 'El nombre completo debe tener al menos 2 caracteres.')
    .trim(),
  role: z.enum(['SUPERADMIN', 'ADMINISTRADOR', 'FUNCIONARIO', 'ANALISTA'], {
    errorMap: () => ({ message: 'Rol inválido. Debe ser SUPERADMIN, ADMINISTRADOR, FUNCIONARIO o ANALISTA.' }),
  }),
});

export const updateUserSchema = z.object({
  username: z.string().min(3).max(50).trim().optional(),
  name: z.string().min(2).trim().optional(),
  role: z.enum(['SUPERADMIN', 'ADMINISTRADOR', 'FUNCIONARIO', 'ANALISTA']).optional(),
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres.').max(128).optional().or(z.literal('')),
});
