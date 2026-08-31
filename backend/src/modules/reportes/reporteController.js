/**
 * ============================================================
 * Módulo de Reportes Ejecutivos — Controlador (SEDER Nayarit)
 * ============================================================
 *
 * Agrega y consolida datos para el Informe de Gobierno del Estado:
 * inversiones, cobertura territorial, inclusión social y avance presupuestal.
 */

import prisma from '../../shared/config/db.js';
import logger from '../../shared/utils/logger.js';
import { SECTORES_DEFAULT } from '../../shared/config/catalogos.js';

export async function getReporteEjecutivo(req, res) {
  try {
    const { anio = '2026', sector, municipio } = req.query;

    const where = {};
    if (sector && sector !== 'TODOS') {
      where.moduloTipo = sector;
    }
    if (municipio && municipio !== 'TODOS') {
      where.productor = { municipio };
    }

    // 1. Expedientes y Productores Totales
    const totalSolicitudes = await prisma.solicitud.count({ where });
    const totalProductores = await prisma.productor.count();

    // 2. Monto de Inversión Total (Campos reales de ApoyoControl: montoTotal, aportacionEstatal, aportacionSolicitante)
    const apoyoAgregado = await prisma.apoyoControl.aggregate({
      _sum: { 
        montoTotal: true, 
        aportacionEstatal: true, 
        aportacionSolicitante: true,
        aportacionPrograma: true 
      },
      where: {
        solicitud: where
      }
    });

    const inversionTotal = Number(apoyoAgregado._sum.montoTotal || 0);
    const aportacionEstatal = Number(apoyoAgregado._sum.aportacionEstatal || apoyoAgregado._sum.aportacionPrograma || 0);
    const aportacionProductores = Number(apoyoAgregado._sum.aportacionSolicitante || 0);

    // 3. Estatus de Solicitudes
    const estatusRaw = await prisma.solicitud.groupBy({
      by: ['status'],
      where,
      _count: { status: true }
    });

    const estatusDist = {
      REGISTRADA: 0,
      'EN REVISIÓN': 0,
      DICTAMINADA: 0,
      APROBADA: 0,
      PAGADA: 0,
      RECHAZADA: 0
    };
    estatusRaw.forEach(e => {
      estatusDist[e.status] = e._count.status;
    });

    // 4. Presupuestos y Avance por Sector
    const presupuestosDB = await prisma.presupuestoSector.findMany();
    const presupuestosMap = {};
    presupuestosDB.forEach(p => {
      presupuestosMap[p.sector] = Number(p.montoAsignado);
    });

    const sectoresData = await Promise.all(
      SECTORES_DEFAULT.map(async (sec) => {
        const count = await prisma.solicitud.count({
          where: { moduloTipo: sec.key, ...where }
        });

        const sumaApoyos = await prisma.apoyoControl.aggregate({
          _sum: { montoTotal: true },
          where: { solicitud: { moduloTipo: sec.key, ...where } }
        });

        const invertido = Number(sumaApoyos._sum.montoTotal || 0);
        const asignado = presupuestosMap[sec.key] || 0;
        const porcentaje = asignado > 0 ? Math.min(100, (invertido / asignado) * 100) : 0;

        return {
          key: sec.key,
          label: sec.label,
          asignado,
          invertido,
          porcentaje: Number(porcentaje.toFixed(1)),
          expedientes: count
        };
      })
    );

    // 5. Cobertura Territorial por Municipio (Consulta directa rápida)
    const coberturaMunicipiosRaw = await prisma.$queryRaw`
      SELECT 
        COALESCE(p.municipio, 'Sin Municipio') as municipio,
        COUNT(DISTINCT p.id)::int as productores,
        COALESCE(SUM(a."montoTotal")::float, 0) as inversion
      FROM "Productor" p
      LEFT JOIN "Solicitud" s ON s."productorId" = p.id
      LEFT JOIN "ApoyoControl" a ON s."apoyoControlId" = a.id
      GROUP BY p.municipio
      ORDER BY inversion DESC, productores DESC
    `;

    const coberturaMunicipios = coberturaMunicipiosRaw.map(m => ({
      municipio: m.municipio,
      productores: Number(m.productores),
      inversion: Number(m.inversion)
    }));

    // 6. Inclusión Social y Perspectiva de Género
    const generoRaw = await prisma.productor.groupBy({
      by: ['genero'],
      _count: { id: true }
    });

    let mujeres = 0;
    let hombres = 0;
    generoRaw.forEach(g => {
      const gen = (g.genero || '').toUpperCase();
      if (gen === 'F' || gen === 'MUJER') mujeres += g._count.id;
      if (gen === 'M' || gen === 'HOMBRE') hombres += g._count.id;
    });

    const indigenas = await prisma.productor.count({
      where: { indigena: 'SI' }
    });

    const conDiscapacidad = await prisma.productor.count({
      where: { discapacidad: 'SI' }
    });

    // 7. Resumen Ejecutivo Final
    res.json({
      ciclo: anio,
      fechaEmision: new Date().toISOString(),
      resumenGlobal: {
        totalSolicitudes,
        totalProductores,
        inversionTotal,
        aportacionEstatal,
        aportacionProductores,
        eficienciaDictamen: totalSolicitudes > 0 
          ? Math.round(((estatusDist.APROBADA + estatusDist.PAGADA) / totalSolicitudes) * 100) 
          : 0
      },
      estatus: estatusDist,
      sectores: sectoresData,
      coberturaMunicipios,
      inclusionSocial: {
        mujeres,
        hombres,
        indigenas,
        conDiscapacidad,
        porcentajeMujeres: totalProductores > 0 ? Math.round((mujeres / totalProductores) * 100) : 0,
        porcentajeIndigenas: totalProductores > 0 ? Math.round((indigenas / totalProductores) * 100) : 0
      }
    });
  } catch (error) {
    logger.error('Error al generar reporte ejecutivo', { error: error.message, stack: error.stack });
    res.status(500).json({ error: 'Error interno al generar reporte ejecutivo.' });
  }
}
