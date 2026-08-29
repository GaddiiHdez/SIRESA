/**
 * ============================================================
 * Módulo de Solicitudes — Controlador
 * ============================================================
 *
 * Maneja las operaciones HTTP sobre los expedientes de solicitudes
 * de apoyo de la Secretaría de Desarrollo Rural.
 *
 * Toda la lógica de negocio compleja (transacciones, folios,
 * estadísticas) está delegada al solicitudService.js para
 * mantener este controlador limpio y enfocado en HTTP.
 *
 * Endpoints:
 *  POST   /api/solicitudes/              → registrarSolicitud()
 *  GET    /api/solicitudes/              → listarSolicitudes() (paginado y filtrable)
 *  GET    /api/solicitudes/stats         → obtenerStats() (dashboard)
 *  GET    /api/solicitudes/productores   → obtenerProductores() (padrón)
 *  GET    /api/solicitudes/:id           → obtenerSolicitud() (detalle)
 *  PATCH  /api/solicitudes/:id/estatus   → actualizarEstatus()
 *  PATCH  /api/solicitudes/:id/documentos → actualizarDocumentos()
 */

import * as service from './solicitudService.js';

/**
 * POST /api/solicitudes/
 *
 * Registra un nuevo expediente de solicitud de apoyo.
 * Delega la creación completa al servicio (incluye transacción,
 * bloqueo de folio y registro de historial inicial).
 *
 * En desarrollo, incluye el detalle del error para facilitar el debug.
 * En producción, oculta el detalle técnico al cliente.
 */
export async function registrarSolicitud(req, res) {
  const { programa, componente, moduloTipo } = req.body;

  // Validación mínima antes de procesar (complementa la validación de Zod en la ruta)
  if (!programa || !componente || !moduloTipo) {
    res.status(400).json({ error: 'Faltan campos obligatorios: programa, componente y módulo son requeridos.' });
    return;
  }

  try {
    // El servicio ejecuta la transacción completa:
    // crea productor → genera folio → crea apoyo → crea solicitud → registra historial
    const result = await service.createSolicitud(req.body, req.user);
    res.status(201).json(result);
  } catch (error) {
    console.error('Error al registrar solicitud:', error?.message || error);

    // En desarrollo mostrar el mensaje exacto del error para facilitar el debug
    const isDev = process.env.NODE_ENV !== 'production';
    res.status(500).json({
      error: 'Error interno del servidor al crear el expediente.',
      detail: isDev ? (error?.message || String(error)) : undefined
    });
  }
}

/**
 * GET /api/solicitudes/
 *
 * Devuelve una lista paginada de expedientes con filtros opcionales.
 * Los metadatos de paginación se envían en cabeceras HTTP personalizadas
 * (x-total-count, x-total-pages, etc.) para no modificar la estructura del body.
 *
 * Filtros disponibles (via query params):
 *  folio, status, programa, curp, municipio, moduloTipo,
 *  genero, tipoPersona, fechaInicio, fechaFin, page, limit
 */
export async function listarSolicitudes(req, res) {
  try {
    const result = await service.getAllSolicitudes(req.query);

    // Metadatos de paginación en cabeceras HTTP (patrón estándar de APIs REST)
    res.setHeader('x-total-count', result.totalItems);
    res.setHeader('x-total-pages', result.totalPages);
    res.setHeader('x-current-page', result.pageNum);
    res.setHeader('x-per-page', result.limitNum);

    res.json(result.solicitudes);
  } catch (error) {
    console.error('Error al listar solicitudes:', error);
    res.status(500).json({ error: 'Error al obtener listado de expedientes.' });
  }
}

/**
 * GET /api/solicitudes/:id
 *
 * Obtiene el detalle completo de un expediente por su ID.
 * Incluye: productor, apoyoControl, historial de estatus,
 * y datos del módulo específico (ganadería, pesca, etc.)
 */
export async function obtenerSolicitud(req, res) {
  const { id } = req.params;

  try {
    const solicitud = await service.getSolicitudById(id);

    if (!solicitud) {
      res.status(404).json({ error: 'Expediente no encontrado.' });
      return;
    }

    res.json(solicitud);
  } catch (error) {
    console.error('Error al obtener solicitud:', error);
    res.status(500).json({ error: 'Error al cargar el expediente.' });
  }
}

/**
 * PATCH /api/solicitudes/:id/estatus
 *
 * Cambia el estatus de un expediente siguiendo las transiciones
 * válidas del flujo de trabajo definido en el servicio.
 *
 * Flujo válido:
 *  REGISTRADA → EN REVISIÓN → DICTAMINADA → APROBADA → PAGADA → FINALIZADA
 *
 * El comentario queda registrado en el historial de cambios del expediente.
 */
export async function actualizarEstatus(req, res) {
  const { id } = req.params;
  const { estatus, comentario } = req.body;

  if (!estatus) {
    res.status(400).json({ error: 'El nuevo estatus es obligatorio.' });
    return;
  }

  try {
    const updated = await service.updateSolicitudEstatus(id, estatus, comentario, req.user);
    res.json(updated);
  } catch (error) {
    console.error('Error al actualizar estatus:', error);
    // El servicio lanza errores con mensajes de negocio descriptivos (transiciones inválidas, documentos faltantes)
    res.status(400).json({ error: error.message || 'Error interno al actualizar el estatus.' });
  }
}

/**
 * PATCH /api/solicitudes/:id/documentos
 *
 * Actualiza las URLs de los documentos cargados en un expediente.
 * Se llama después de subir los archivos con /api/upload.
 *
 * Documentos manejados: ineUrl, curpUrl, rfcUrl, comprobanteUrl, facturaUrl
 */
export async function actualizarDocumentos(req, res) {
  const { id } = req.params;

  try {
    const updated = await service.updateSolicitudDocumentos(id, req.body);
    res.json(updated);
  } catch (error) {
    logger.error('Error al actualizar documentos:', { error: error.message, solicitudId: id });
    res.status(500).json({ error: 'Error interno al actualizar los documentos del expediente.' });
  }
}

/**
 * GET /api/solicitudes/stats
 *
 * Genera las estadísticas agregadas para el dashboard principal.
 * Incluye: totales, inversión, beneficiarios, distribución por
 * estatus, módulo y municipio.
 */
export async function obtenerStats(req, res) {
  try {
    const stats = await service.getStatsDashboard();
    res.json(stats);
  } catch (error) {
    console.error('Error al obtener estadísticas del dashboard:', error);
    res.status(500).json({ error: 'Error al generar las analíticas del sistema.' });
  }
}

/**
 * GET /api/solicitudes/productores
 *
 * Devuelve el padrón completo de productores registrados
 * con sus solicitudes asociadas (para la vista de ProductoresPage).
 */
export async function obtenerProductores(req, res) {
  try {
    const list = await service.getProductoresList();
    res.json(list);
  } catch (error) {
    console.error('Error al obtener lista de productores:', error);
    res.status(500).json({ error: 'Error al obtener el padrón de productores.' });
  }
}

/**
 * GET /api/solicitudes/productores/buscar?q=...
 *
 * Consulta si un ciudadano u organización ya existe por CURP o RFC.
 */
export async function buscarProductor(req, res) {
  try {
    const { q } = req.query;
    if (!q) {
      res.status(400).json({ error: 'El parámetro q (CURP o RFC) es requerido.' });
      return;
    }
    const productor = await service.buscarProductorByCurpOrRfc(q);
    res.json({ existe: !!productor, productor });
  } catch (error) {
    console.error('Error al buscar productor por CURP/RFC:', error);
    res.status(500).json({ error: 'Error al consultar unicidad de productor.' });
  }
}
