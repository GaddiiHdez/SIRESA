/**
 * ============================================================
 * Módulo de Presupuestos — Controlador
 * ============================================================
 *
 * Maneja la actualización del presupuesto asignado por sector productivo.
 * Estos montos se comparan con la inversión real en el dashboard.
 *
 * Sectores con presupuesto: GANADERIA, AGRICULTURA_FRIJOL,
 * PESCA_ACUACULTURA, INFRAESTRUCTURA, MAQUINARIA
 *
 * Endpoint:
 *  PATCH /api/presupuestos/ → actualizarPresupuesto()
 *  PUT   /api/presupuestos/ → actualizarPresupuesto() (alias)
 */

import prisma from '../../shared/config/db.js';
import { clearStatsCache } from '../solicitudes/solicitudService.js';
import logger from '../../shared/utils/logger.js';
import { registrarAuditoria } from '../../shared/services/auditService.js';

/**
 * PATCH/PUT /api/presupuestos/
 *
 * Actualiza o registra el monto de presupuesto asignado para uno o varios sectores productivos.
 * Solo usuarios con rol SUPERADMIN o ADMINISTRADOR pueden realizar esta operación.
 *
 * Formatos de Body soportados:
 * 1. Individual: { sector: string, montoAsignado: number }
 * 2. En lote (Array): { presupuestos: [{ sector, montoAsignado }] }
 * 3. En lote (Objeto/Mapa): { presupuestos: { AGRICULTURA_FRIJOL: 2500000, ... } }
 * 4. Array directo: [{ sector, montoAsignado }, ...]
 */
export async function actualizarPresupuesto(req, res) {
  try {
    const body = req.body;
    const itemsToUpdate = [];

    // Formato 1: Array directo en req.body
    if (Array.isArray(body)) {
      itemsToUpdate.push(...body);
    }
    // Formato 2: { presupuestos: [...] }
    else if (Array.isArray(body?.presupuestos)) {
      itemsToUpdate.push(...body.presupuestos);
    }
    // Formato 3: { presupuestos: { SECTOR: monto, ... } }
    else if (body?.presupuestos && typeof body.presupuestos === 'object') {
      for (const [sec, monto] of Object.entries(body.presupuestos)) {
        itemsToUpdate.push({ sector: sec, montoAsignado: monto });
      }
    }
    // Formato 4: { sector, montoAsignado } individual
    else if (body?.sector !== undefined && body?.montoAsignado !== undefined) {
      itemsToUpdate.push({ sector: body.sector, montoAsignado: body.montoAsignado });
    }

    if (itemsToUpdate.length === 0) {
      res.status(400).json({ error: 'Debes proporcionar al menos un sector y su monto asignado.' });
      return;
    }

    const results = [];
    for (const item of itemsToUpdate) {
      const sector = item.sector?.trim();
      const parsedMonto = parseFloat(item.montoAsignado);

      if (!sector || isNaN(parsedMonto) || parsedMonto < 0) {
        continue; // Ignorar entradas inválidas
      }

      // Upsert: Si existe actualiza, si no existe lo crea en la BD
      const upserted = await prisma.presupuestoSector.upsert({
        where: { sector },
        update: { montoAsignado: parsedMonto },
        create: { sector, montoAsignado: parsedMonto }
      });
      results.push(upserted);
    }

    // Invalidar la caché de estadísticas para que el dashboard refleje los cambios al instante
    clearStatsCache();

    // Registrar en la bitácora de auditoría
    registrarAuditoria({
      accion: 'AJUSTE_PRESUPUESTO',
      modulo: 'PRESUPUESTOS',
      detalles: `Ajuste presupuestal de ${results.length} sector(es) productivo(s)`,
      valoresNue: results.map(r => ({ sector: r.sector, montoAsignado: Number(r.montoAsignado) })),
      req
    });

    logger.info(`Presupuestos sectoriales actualizados (${results.length} sectores) por usuario: ${req.user?.username}`);

    res.json({
      success: true,
      message: 'Presupuestos actualizados correctamente.',
      data: results.length === 1 ? results[0] : results
    });
  } catch (error) {
    logger.error('Error al actualizar presupuesto sectorial:', { error: error.message });
    res.status(500).json({ error: 'Error interno al actualizar el presupuesto.' });
  }
}
