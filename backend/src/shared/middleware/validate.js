/**
 * ============================================================
 * Middleware de Validación — Zod Schema Validation
 * ============================================================
 *
 * Proporciona tres funciones que validan automáticamente los datos
 * entrantes de una petición HTTP usando esquemas definidos con Zod.
 *
 * Si la validación falla, devuelve 400 con el detalle de los errores.
 * Si pasa, reemplaza los datos en req con los valores limpios y
 * transformados por Zod (trim, tipos correctos, valores por defecto, etc.)
 *
 * Uso en rutas:
 *   import { validate, validateParams, validateQuery } from '...';
 *   import { crearSolicitudSchema, idParamSchema, listarQuerySchema } from '...';
 *
 *   router.post('/', validate(crearSolicitudSchema), handler);         // Valida req.body
 *   router.get('/:id', validateParams(idParamSchema), handler);        // Valida req.params
 *   router.get('/', validateQuery(listarQuerySchema), handler);        // Valida req.query
 */

/**
 * Middleware base de validación.
 * @param {ZodSchema} schema - El schema Zod a usar para validar
 * @param {'body'|'query'|'params'} source - Qué parte de la petición validar
 */
export function validate(schema, source = 'body') {
  return (req, res, next) => {
    // safeParse no lanza excepciones; devuelve { success, data } o { success: false, error }
    const result = schema.safeParse(req[source]);

    if (!result.success) {
      // Extraer la lista de errores y formatearlos de forma legible para el cliente
      const issues = result.error.issues || result.error.errors || [];
      return res.status(400).json({
        error: 'Error de validación.',
        detalles: issues.map(e => ({
          campo: e.path.join('.'),   // Ruta del campo con error (ej: "productor.nombre")
          mensaje: e.message         // Mensaje de error definido en el schema Zod
        }))
      });
    }

    // Reemplazar los datos originales con los datos parseados/limpios por Zod.
    // Para query y params (objetos read-only en Express), hay que modificar propiedades
    // en lugar de reasignar el objeto completo.
    if (source === 'query' || source === 'params') {
      for (const key in req[source]) {
        delete req[source][key];
      }
      Object.assign(req[source], result.data);
    } else {
      // Para body, podemos reasignar directamente
      req[source] = result.data;
    }

    next();
  };
}

/**
 * Alias para validar req.params (identificadores de ruta, ej: /:id)
 */
export function validateParams(schema) {
  return validate(schema, 'params');
}

/**
 * Alias para validar req.query (parámetros de consulta, ej: ?page=1&limit=20)
 */
export function validateQuery(schema) {
  return validate(schema, 'query');
}
