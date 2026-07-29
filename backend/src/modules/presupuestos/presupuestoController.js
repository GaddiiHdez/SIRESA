import prisma from '../../shared/config/db.js';

export async function actualizarPresupuesto(req, res) {
  const { sector, montoAsignado } = req.body;

  if (!sector || montoAsignado === undefined || montoAsignado === null) {
    res.status(400).json({ error: 'El sector y el monto asignado son requeridos.' });
    return;
  }

  const parsedMonto = parseFloat(montoAsignado);
  if (isNaN(parsedMonto) || parsedMonto < 0) {
    res.status(400).json({ error: 'El monto asignado debe ser un número positivo.' });
    return;
  }

  try {
    const updated = await prisma.presupuestoSector.update({
      where: { sector },
      data: { montoAsignado: parsedMonto }
    });
    res.json(updated);
  } catch (error) {
    console.error('Error al actualizar presupuesto sectorial:', error);
    res.status(500).json({ error: 'Error interno al actualizar el presupuesto.' });
  }
}
