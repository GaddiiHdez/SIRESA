import * as service from './solicitudService.js';

export async function registrarSolicitud(req, res) {
  const { programa, componente, moduloTipo } = req.body;

  if (!programa || !componente || !moduloTipo) {
    res.status(400).json({ error: 'Faltan campos obligatorios para registrar la solicitud.' });
    return;
  }

  try {
    const result = await service.createSolicitud(req.body, req.user);
    res.status(201).json(result);
  } catch (error) {
    console.error('Error al registrar solicitud:', error?.message || error);
    const isDev = process.env.NODE_ENV !== 'production';
    res.status(500).json({
      error: 'Error interno del servidor al crear el expediente.',
      detail: isDev ? (error?.message || String(error)) : undefined
    });
  }
}

export async function listarSolicitudes(req, res) {
  try {
    const result = await service.getAllSolicitudes(req.query);

    res.setHeader('x-total-count', result.totalItems);
    res.setHeader('x-total-pages', result.totalPages);
    res.setHeader('x-current-page', result.pageNum);
    res.setHeader('x-per-page', result.limitNum);

    res.json(result.solicitudes);
  } catch (error) {
    console.error('Error al listar solicitudes:', error);
    res.status(500).json({ error: 'Error al obtener listado.' });
  }
}

export async function obtenerSolicitud(req, res) {
  const { id } = req.params;

  try {
    const solicitud = await service.getSolicitudById(id);

    if (!solicitud) {
      res.status(404).json({ error: 'Solicitud no encontrada.' });
      return;
    }

    res.json(solicitud);
  } catch (error) {
    console.error('Error al obtener solicitud:', error);
    res.status(500).json({ error: 'Error al cargar expediente.' });
  }
}

export async function actualizarEstatus(req, res) {
  const { id } = req.params;
  const { estatus, comentario } = req.body;

  if (!estatus) {
    res.status(400).json({ error: 'El estatus es obligatorio.' });
    return;
  }

  try {
    const updated = await service.updateSolicitudEstatus(id, estatus, comentario, req.user);
    res.json(updated);
  } catch (error) {
    console.error('Error al actualizar estatus:', error);
    res.status(400).json({ error: error.message || 'Error interno al actualizar el estatus.' });
  }
}

export async function actualizarDocumentos(req, res) {
  const { id } = req.params;

  try {
    const updated = await service.updateSolicitudDocumentos(id, req.body);
    res.json(updated);
  } catch (error) {
    console.error('Error al actualizar documentos:', error);
    res.status(500).json({ error: 'Error interno al actualizar los documentos.' });
  }
}

export async function obtenerStats(req, res) {
  try {
    const stats = await service.getStatsDashboard();
    res.json(stats);
  } catch (error) {
    console.error('Error al obtener estadísticas del backend:', error);
    res.status(500).json({ error: 'Error al generar analíticas.' });
  }
}

export async function obtenerProductores(req, res) {
  try {
    const list = await service.getProductoresList();
    res.json(list);
  } catch (error) {
    console.error('Error al obtener lista de productores:', error);
    res.status(500).json({ error: 'Error al obtener padrón de productores.' });
  }
}
