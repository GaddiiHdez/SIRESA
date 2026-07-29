import * as catalogos from '../../shared/config/catalogos.js';

export async function getCatalogos(req, res) {
  try {
    res.json({
      municipios: Object.keys(catalogos.MUNICIPIOS_LOCALIDADES),
      municipiosLocalidades: catalogos.MUNICIPIOS_LOCALIDADES,
      programasComponentes: catalogos.PROGRAMAS_COMPONENTES,
      generos: catalogos.GENEROS,
      etnias: catalogos.ETNIAS,
      tiposDiscapacidad: catalogos.TIPOS_DISCAPACIDAD,
      tiposIdentificacion: catalogos.TIPOS_IDENTIFICACION,
      tenenciasTierra: catalogos.TENENCIAS_TIERRA,
      gradosMarginacion: catalogos.GRADOS_MARGINACION,
      priorizaciones: catalogos.PRIORIZACIONES,
      dictamenes: catalogos.DICTAMENES,
      trimestres: catalogos.TRIMESTRES
    });
  } catch (error) {
    console.error('Error al cargar catálogos:', error);
    res.status(500).json({ error: 'Error al obtener catálogos' });
  }
}
