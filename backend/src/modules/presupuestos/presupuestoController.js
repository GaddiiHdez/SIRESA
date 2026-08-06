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

/**
 * PATCH/PUT /api/presupuestos/
 *
 * Actualiza el monto de presupuesto asignado para un sector productivo.
 * Solo usuarios con rol SUPERADMIN o ADMINISTRADOR pueden realizar esta operación.
 *
 * Body esperado: { sector: string, montoAsignado: number }
 *
 * El registro del sector debe existir previamente (creado en el seed inicial).
 * Si el sector no existe, Prisma lanzará un error P2025 (capturado por errorHandler).
 */
export async function actualizarPresupuesto(req, res) {
  const { sector, montoAsignado } = req.body;

  // Validar que llegaron los campos requeridos
  if (!sector || montoAsignado === undefined || montoAsignado === null) {
    res.status(400).json({ error: 'El sector y el monto asignado son requeridos.' });
    return;
  }

  // Convertir y validar que el monto sea un número positivo
  const parsedMonto = parseFloat(montoAsignado);
  if (isNaN(parsedMonto) || parsedMonto < 0) {
    res.status(400).json({ error: 'El monto asignado debe ser un número positivo.' });
    return;
  }

  try {
    // Actualizar el registro en la tabla PresupuestoSector
    const updated = await prisma.presupuestoSector.update({
      where: { sector }, // sector es campo UNIQUE en el schema
      data: { montoAsignado: parsedMonto }
    });
    res.json(updated);
  } catch (error) {
    console.error('Error al actualizar presupuesto sectorial:', error);
    res.status(500).json({ error: 'Error interno al actualizar el presupuesto.' });
  }
}
