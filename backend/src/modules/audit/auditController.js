/**
 * ============================================================
 * Módulo de Auditoría Forense — Controlador (SUPERADMIN)
 * ============================================================
 */

import prisma from '../../shared/config/db.js';
import logger from '../../shared/utils/logger.js';

/**
 * GET /api/audit
 * Lista registros de auditoría paginados con filtros dinámicos.
 */
export async function getAuditLogs(req, res) {
  try {
    const {
      page = 1,
      limit = 25,
      modulo,
      accion,
      username,
      search,
      fechaInicio,
      fechaFin
    } = req.query;

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 25));
    const skip = (pageNum - 1) * limitNum;

    const where = {};

    if (modulo && modulo !== 'TODOS') {
      where.modulo = modulo;
    }

    if (accion && accion !== 'TODOS') {
      where.accion = accion;
    }

    if (username) {
      where.username = { contains: username.trim().toLowerCase(), mode: 'insensitive' };
    }

    if (search) {
      where.OR = [
        { detalles: { contains: search, mode: 'insensitive' } },
        { username: { contains: search, mode: 'insensitive' } },
        { accion: { contains: search, mode: 'insensitive' } },
        { ipAddress: { contains: search, mode: 'insensitive' } }
      ];
    }

    if (fechaInicio || fechaFin) {
      where.createdAt = {};
      if (fechaInicio) where.createdAt.gte = new Date(fechaInicio);
      if (fechaFin) {
        const end = new Date(fechaFin);
        end.setHours(23, 59, 59, 999);
        where.createdAt.lte = end;
      }
    }

    const totalItems = await prisma.auditLog.count({ where });
    const totalPages = Math.ceil(totalItems / limitNum);

    const logs = await prisma.auditLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip,
      take: limitNum
    });

    res.json({
      totalItems,
      totalPages,
      page: pageNum,
      limit: limitNum,
      logs
    });
  } catch (error) {
    logger.error('Error al consultar bitácora de auditoría', { error: error.message });
    res.status(500).json({ error: 'Error al consultar registros de auditoría.' });
  }
}

/**
 * GET /api/audit/stats
 * Resumen analítico de la actividad del sistema.
 */
export async function getAuditStats(req, res) {
  try {
    const totalRegistros = await prisma.auditLog.count();

    const inicioHoy = new Date();
    inicioHoy.setHours(0, 0, 0, 0);

    const eventosHoy = await prisma.auditLog.count({
      where: { createdAt: { gte: inicioHoy } }
    });

    // Agrupación por módulo
    const porModuloRaw = await prisma.auditLog.groupBy({
      by: ['modulo'],
      _count: { modulo: true }
    });

    // Agrupación por acción
    const porAccionRaw = await prisma.auditLog.groupBy({
      by: ['accion'],
      _count: { accion: true },
      orderBy: { _count: { accion: 'desc' } },
      take: 8
    });

    // Usuarios más activos
    const topUsuariosRaw = await prisma.auditLog.groupBy({
      by: ['username', 'userRole'],
      _count: { username: true },
      orderBy: { _count: { username: 'desc' } },
      take: 5
    });

    res.json({
      totalRegistros,
      eventosHoy,
      porModulo: porModuloRaw.map(m => ({ modulo: m.modulo, total: m._count.modulo })),
      porAccion: porAccionRaw.map(a => ({ accion: a.accion, total: a._count.accion })),
      topUsuarios: topUsuariosRaw.map(u => ({ username: u.username, role: u.userRole, total: u._count.username }))
    });
  } catch (error) {
    logger.error('Error al consultar estadísticas de auditoría', { error: error.message });
    res.status(500).json({ error: 'Error al consultar estadísticas de auditoría.' });
  }
}
