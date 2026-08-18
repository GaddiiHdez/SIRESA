/**
 * ============================================================
 * Módulo Geodirectorio — Controlador Backend
 * Secretaría de Desarrollo Rural de Nayarit
 * ============================================================
 *
 * Proporciona los puntos geográficos unificados para el visor cartográfico:
 *  - Productores e identificaciones
 *  - UPPs y Predios Ganaderos (con latitudN / longitudW reales)
 *  - Puntos de Servicio Ganadero (PSG) / Proveedores
 *  - Fallback con dispersión geográfica limpia por municipio/localidad
 */

import prisma from '../../shared/config/db.js';

// Coordenadas centroides de los 20 municipios de Nayarit
const MUNICIPIO_CENTROIDES = {
  'Tepic': { lat: 21.5039, lng: -104.8947 },
  'Santiago Ixcuintla': { lat: 21.8108, lng: -105.2081 },
  'Compostela': { lat: 21.2361, lng: -104.9008 },
  'Bahía de Banderas': { lat: 20.8000, lng: -105.2500 },
  'Acaponeta': { lat: 22.4964, lng: -105.3597 },
  'Tecuala': { lat: 22.3983, lng: -105.4583 },
  'Rosamorada': { lat: 22.1222, lng: -105.2056 },
  'Tuxpan': { lat: 21.9422, lng: -105.2958 },
  'San Blas': { lat: 21.5408, lng: -105.2853 },
  'Xalisco': { lat: 21.4458, lng: -104.8986 },
  'Ruíz': { lat: 21.9500, lng: -105.1431 },
  'Huajicori': { lat: 22.6347, lng: -105.3189 },
  'Del Nayar': { lat: 22.2472, lng: -104.5822 },
  'La Yesca': { lat: 21.3189, lng: -104.0139 },
  'Santa María del Oro': { lat: 21.3339, lng: -104.5861 },
  'San Pedro Lagunillas': { lat: 21.2189, lng: -104.7522 },
  'Jala': { lat: 21.1689, lng: -104.4339 },
  'Ahuacatlán': { lat: 21.0539, lng: -104.4836 },
  'Ixtlán del Río': { lat: 21.0369, lng: -104.3717 },
  'Amatlán de Cañas': { lat: 20.8061, lng: -104.4039 }
};

/**
 * Genera un pequeño desplazamiento determinista basado en un string (ID)
 * para evitar que marcadores en el mismo municipio queden encimados.
 */
function getJitter(idStr) {
  let hash = 0;
  for (let i = 0; i < idStr.length; i++) {
    hash = (hash << 5) - hash + idStr.charCodeAt(i);
    hash |= 0;
  }
  const latOffset = ((hash % 100) / 1000) * 0.15;
  const lngOffset = (((hash >> 2) % 100) / 1000) * 0.15;
  return { latOffset, lngOffset };
}

/**
 * GET /api/directorio/geo
 * Devuelve todos los puntos geográficos procesados para el mapa interactivo.
 */
export async function getGeodirectorioData(req, res) {
  try {
    const { search, tipo, municipio } = req.query;

    const solicitudes = await prisma.solicitud.findMany({
      include: {
        productor: true,
        apoyoControl: true,
        datosGanaderia: true,
        datosAgriculturaFrijol: true,
        datosPescaAcuacultura: true,
        datosInfraestructura: true,
        datosMaquinaria: true,
        datosMedios: true,
        datosTemasImportantes: true
      },
      orderBy: { createdAt: 'desc' }
    });

    const puntos = [];

    solicitudes.forEach((sol) => {
      const prod = sol.productor;
      const apoyo = sol.apoyoControl;
      const ganaderia = sol.datosGanaderia;

      const muniNombre = prod?.municipio || ganaderia?.municipio || 'Tepic';
      const centroide = MUNICIPIO_CENTROIDES[muniNombre] || MUNICIPIO_CENTROIDES['Tepic'];
      const jitter = getJitter(sol.id);

      // ─── 1. Determinar Coordenadas Reales o Estimadas ─────────────────────────
      let lat = centroide.lat + jitter.latOffset;
      let lng = centroide.lng + jitter.lngOffset;
      let esCoordenadaExacta = false;

      if (ganaderia?.latitudN && ganaderia?.longitudW) {
        const parsedLat = parseFloat(ganaderia.latitudN);
        const parsedLng = parseFloat(ganaderia.longitudW);
        if (!isNaN(parsedLat) && !isNaN(parsedLng)) {
          lat = parsedLat;
          lng = parsedLng;
          esCoordenadaExacta = true;
        }
      }

      // ─── 2. Determinar Tipo de Punto Cartográfico ─────────────────────────────
      let categoriaPunto = 'PRODUCTOR'; // Default: Productor
      if (sol.moduloTipo === 'GANADERIA' && ganaderia?.upp) {
        categoriaPunto = 'UPP';
      } else if (apoyo?.proveedor || sol.moduloTipo === 'MAQUINARIA') {
        categoriaPunto = 'PSG';
      }

      // ─── 3. Aplicar Filtros Dinámicos si existen ──────────────────────────────
      if (tipo && tipo !== 'ALL' && categoriaPunto !== tipo) {
        return;
      }

      if (municipio && muniNombre.toLowerCase() !== municipio.toLowerCase()) {
        return;
      }

      if (search) {
        const q = search.toLowerCase().trim();
        const matchNombre = prod?.nombre?.toLowerCase().includes(q) ||
                            prod?.apellidoPaterno?.toLowerCase().includes(q) ||
                            prod?.nombreOrganizacion?.toLowerCase().includes(q);
        const matchFolio = sol.folio.toLowerCase().includes(q);
        const matchCurp = prod?.curp?.toLowerCase().includes(q) || prod?.rfc?.toLowerCase().includes(q);
        const matchUpp = ganaderia?.upp?.toLowerCase().includes(q) || ganaderia?.nombrePredio?.toLowerCase().includes(q);
        const matchProveedor = apoyo?.proveedor?.toLowerCase().includes(q);

        if (!matchNombre && !matchFolio && !matchCurp && !matchUpp && !matchProveedor) {
          return;
        }
      }

      // ─── 4. Armar Objeto Punto ────────────────────────────────────────────────
      puntos.push({
        id: sol.id,
        folio: sol.folio,
        status: sol.status,
        moduloTipo: sol.moduloTipo,
        programa: sol.programa,
        componente: sol.componente,
        categoriaPunto,
        esCoordenadaExacta,
        coordenadas: { lat, lng },
        productor: prod ? {
          id: prod.id,
          nombreCompleto: prod.tipoPersona === 'MORAL'
            ? prod.nombreOrganizacion
            : `${prod.nombre || ''} ${prod.apellidoPaterno || ''} ${prod.apellidoMaterno || ''}`.trim(),
          tipoPersona: prod.tipoPersona,
          curp: prod.curp,
          rfc: prod.rfc,
          telefono: prod.telefono,
          domicilio: prod.domicilio,
          municipio: prod.municipio,
          localidad: prod.localidad,
          genero: prod.genero
        } : null,
        apoyo: apoyo ? {
          concepto: apoyo.conceptoApoyo,
          montoTotal: Number(apoyo.montoTotal),
          proveedor: apoyo.proveedor,
          dictamen: apoyo.dictamen
        } : null,
        ganaderia: ganaderia ? {
          nombrePredio: ganaderia.nombrePredio,
          upp: ganaderia.upp,
          latitudN: ganaderia.latitudN,
          longitudW: ganaderia.longitudW
        } : null
      });
    });

    res.json({
      totalPuntos: puntos.length,
      puntos
    });
  } catch (error) {
    console.error('Error al generar datos del Geodirectorio:', error);
    res.status(500).json({ error: 'Error al consultar datos geográficos.' });
  }
}
