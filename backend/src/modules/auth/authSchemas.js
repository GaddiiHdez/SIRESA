import { z } from 'zod';

/**
 * Schemas de validación Zod para el módulo de autenticación.
 */

export const loginSchema = z.object({
  username: z
    .string({ required_error: 'El usuario es requerido.' })
    .min(3, 'El usuario debe tener al menos 3 caracteres.')
    .max(50, 'El usuario no puede exceder 50 caracteres.')
    .trim(),
  password: z
    .string({ required_error: 'La contraseña es requerida.' })
    .min(6, 'La contraseña debe tener al menos 6 caracteres.')
    .max(128, 'La contraseña no puede exceder 128 caracteres.')
});
