/**
 * Middleware genérico de validación con Zod.
 * Acepta un schema Zod y valida req.body, req.query o req.params.
 * 
 * Uso:
 *   import { validate } from '../../shared/middleware/validate.js';
 *   import { loginSchema } from './schemas.js';
 *   router.post('/login', validate(loginSchema), loginHandler);
 */

export function validate(schema, source = 'body') {
  return (req, res, next) => {
    const result = schema.safeParse(req[source]);

    if (!result.success) {
      const issues = result.error.issues || result.error.errors || [];
      return res.status(400).json({
        error: 'Error de validación.',
        detalles: issues.map(e => ({
          campo: e.path.join('.'),
          mensaje: e.message
        }))
      });
    }

    // Reemplazar con datos parseados (limpiados y transformados por Zod) de forma segura en getters read-only
    if (source === 'query' || source === 'params') {
      for (const key in req[source]) {
        delete req[source][key];
      }
      Object.assign(req[source], result.data);
    } else {
      req[source] = result.data;
    }
    next();
  };
}

/**
 * Validador para req.params (IDs, etc.)
 */
export function validateParams(schema) {
  return validate(schema, 'params');
}

/**
 * Validador para req.query (filtros, paginación, etc.)
 */
export function validateQuery(schema) {
  return validate(schema, 'query');
}
