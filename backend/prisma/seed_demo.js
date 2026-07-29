import prisma from '../src/shared/config/db.js';

async function main() {
  console.log('Iniciando limpieza total de expedientes en la base de datos...');

  // 1. Limpiar de forma ordenada todas las tablas técnicas y principales
  await prisma.historialEstatus.deleteMany();
  await prisma.datosGanaderia.deleteMany();
  await prisma.datosAgriculturaFrijol.deleteMany();
  await prisma.datosPescaAcuacultura.deleteMany();
  await prisma.datosInfraestructura.deleteMany();
  await prisma.datosMaquinaria.deleteMany();
  await prisma.datosMedios.deleteMany();
  await prisma.datosTemasImportantes.deleteMany();
  await prisma.solicitud.deleteMany();
  await prisma.productor.deleteMany();
  await prisma.apoyoControl.deleteMany();

  console.log('Base de datos limpiada con éxito. Iniciando generación de 10 expedientes de prueba...');

  // Datos de los 10 expedientes
  
  // ─── EXPEDIENTE 1: AGRICULTURA ──────────────────────────────
  const prod1 = await prisma.productor.create({
    data: {
      tipoPersona: 'FISICA',
      nombre: 'Juan',
      apellidoPaterno: 'Perez',
      apellidoMaterno: 'Gomez',
      rfc: 'PEGA700101XYZ',
      curp: 'PEGJ700101HNTXXR01',
      genero: 'Hombre',
      domicilio: 'Calle Independencia 45, Pozo de Ibarra',
      municipio: 'Santiago Ixcuintla',
      localidad: 'Pozo de Ibarra',
      indigena: 'NO',
      discapacidad: 'NO'
    }
  });

  const apoyo1 = await prisma.apoyoControl.create({
    data: {
      conceptoApoyo: 'Semilla Certificada de Frijol Negro',
      cantidad: 120,
      unidadMedida: 'Bultos',
      montoTotal: 35000,
      aportacionPrograma: 25000,
      aportacionSolicitante: 10000,
      aportacionEstatal: 0,
      aportacionFederal: 0,
      gradoMarginacion: 'Medio',
      tenenciaTierra: 'Ejidal',
      estatus: 'REGISTRADA',
      priorizacion: 'Media',
      dictamen: 'Sin Dictamen',
      trimestre: 'Primer'
    }
  });

  const sol1 = await prisma.solicitud.create({
    data: {
      folio: 'SDR-NY-2026-0001',
      programa: 'Programa de Fomento Agrícola (SDR-AGRI)',
      componente: 'Semilla Subsidiada Ciclo O-I',
      moduloTipo: 'AGRICULTURA_FRIJOL',
      status: 'REGISTRADA',
      productorId: prod1.id,
      apoyoControlId: apoyo1.id
    }
  });

  await prisma.datosAgriculturaFrijol.create({
    data: {
      solicitudId: sol1.id,
      municipioActa: 'Santiago Ixcuintla',
      localidadActa: 'Santiago Ixcuintla Centro',
      fechaActa: new Date(),
      variedadSemillaCertificada: 'Negro Jamapa',
      cantidadAutorizadaKg: 6000,
      superficieAutorizadaHa: 10,
      tituloPropiedad: 'Certificado Parcelario 00192',
      numeroDocumento: 'DOC-982'
    }
  });

  await prisma.historialEstatus.create({
    data: {
      solicitudId: sol1.id,
      estatus: 'REGISTRADA',
      comentario: 'Expediente digitalizado y registrado en sistema.',
      funcionario: 'Administrador Demo'
    }
  });

  // ─── EXPEDIENTE 2: GANADERIA ────────────────────────────────
  const prod2 = await prisma.productor.create({
    data: {
      tipoPersona: 'FISICA',
      nombre: 'Maria Elena',
      apellidoPaterno: 'Ruiz',
      apellidoMaterno: 'Salas',
      rfc: 'RUSA750808XYZ',
      curp: 'RUIM750808MNTXXR02',
      genero: 'Mujer',
      domicilio: 'Rancho La Providencia Km 4.5',
      municipio: 'Acaponeta',
      localidad: 'El Recodo',
      indigena: 'NO',
      discapacidad: 'NO'
    }
  });

  const apoyo2 = await prisma.apoyoControl.create({
    data: {
      conceptoApoyo: 'Silo metálico para almacenamiento de forraje',
      cantidad: 2,
      unidadMedida: 'Unidades',
      montoTotal: 48000,
      aportacionPrograma: 30000,
      aportacionSolicitante: 18000,
      aportacionEstatal: 0,
      aportacionFederal: 0,
      gradoMarginacion: 'Bajo',
      tenenciaTierra: 'Propiedad Privada',
      estatus: 'EN REVISIÓN',
      priorizacion: 'Media',
      dictamen: 'Sin Dictamen',
      trimestre: 'Primer'
    }
  });

  const sol2 = await prisma.solicitud.create({
    data: {
      folio: 'SDR-NY-2026-0002',
      programa: 'Programa de Desarrollo Ganadero (SDR-GANA)',
      componente: 'Infraestructura y Forrajes',
      moduloTipo: 'GANADERIA',
      status: 'EN REVISIÓN',
      productorId: prod2.id,
      apoyoControlId: apoyo2.id,
      ineUrl: '/uploads/ine-demo.pdf',
      curpUrl: '/uploads/curp-demo.pdf',
      rfcUrl: '/uploads/rfc-demo.pdf',
      comprobanteUrl: '/uploads/comprobante-demo.pdf',
      facturaUrl: '/uploads/factura-demo.pdf'
    }
  });

  await prisma.datosGanaderia.create({
    data: {
      solicitudId: sol2.id,
      nombrePredio: 'La Providencia',
      municipio: 'Acaponeta',
      localidad: 'El Recodo',
      upp: '18-001-00234-01',
      latitudN: '22.4567 N',
      longitudW: '105.3456 W',
      inventarioGanadero: '35 cabezas de ganado bovino doble propósito'
    }
  });

  await prisma.historialEstatus.create({
    data: {
      solicitudId: sol2.id,
      estatus: 'REGISTRADA',
      comentario: 'Registro de solicitud.',
      funcionario: 'Administrador Demo'
    }
  });

  await prisma.historialEstatus.create({
    data: {
      solicitudId: sol2.id,
      estatus: 'EN REVISIÓN',
      comentario: 'Documentación física bajo revisión del supervisor.',
      funcionario: 'Administrador Demo'
    }
  });

  // ─── EXPEDIENTE 3: PESCA ────────────────────────────────────
  const prod3 = await prisma.productor.create({
    data: {
      tipoPersona: 'MORAL',
      nombreOrganizacion: 'Cooperativa Ostioneros de San Blas S.C.',
      representante: 'Pedro Castillon Lopez',
      rfc: 'CPR150220XYZ',
      domicilio: 'Embarcadero Bellavista s/n',
      municipio: 'San Blas',
      localidad: 'El Conchal',
      indigena: 'NO',
      discapacidad: 'NO'
    }
  });

  const apoyo3 = await prisma.apoyoControl.create({
    data: {
      conceptoApoyo: 'Motores fuera de borda 60HP',
      cantidad: 3,
      unidadMedida: 'Equipos',
      montoTotal: 270000,
      aportacionPrograma: 200000,
      aportacionSolicitante: 70000,
      aportacionEstatal: 0,
      aportacionFederal: 0,
      gradoMarginacion: 'Alto',
      tenenciaTierra: 'Comunal',
      estatus: 'APROBADA',
      priorizacion: 'Alta',
      dictamen: 'Procedente',
      trimestre: 'Segundo'
    }
  });

  const sol3 = await prisma.solicitud.create({
    data: {
      folio: 'SDR-NY-2026-0003',
      programa: 'Apoyo a la Acuacultura y Pesca (SDR-PESC)',
      componente: 'Modernización de Embarcaciones Menores',
      moduloTipo: 'PESCA_ACUACULTURA',
      status: 'APROBADA',
      productorId: prod3.id,
      apoyoControlId: apoyo3.id,
      ineUrl: '/uploads/ine-demo.pdf',
      curpUrl: '/uploads/curp-demo.pdf',
      rfcUrl: '/uploads/rfc-demo.pdf',
      comprobanteUrl: '/uploads/comprobante-demo.pdf',
      facturaUrl: '/uploads/factura-demo.pdf'
    }
  });

  await prisma.datosPescaAcuacultura.create({
    data: {
      solicitudId: sol3.id,
      domicilioUnidadProductiva: 'Embarcadero Bellavista',
      municipio: 'San Blas',
      localidad: 'El Conchal',
      concesionAgua: 'CONAGUA-2024-PESCA-098',
      permisoPesca: 'DGPA-123-2025',
      rnpa: 'RNPA-18-09-082'
    }
  });

  await prisma.historialEstatus.create({
    data: {
      solicitudId: sol3.id,
      estatus: 'REGISTRADA',
      comentario: 'Registro.',
      funcionario: 'Administrador Demo'
    }
  });

  await prisma.historialEstatus.create({
    data: {
      solicitudId: sol3.id,
      estatus: 'DICTAMINADA',
      comentario: 'Comité de evaluación aprueba el expediente.',
      funcionario: 'Administrador Demo'
    }
  });

  await prisma.historialEstatus.create({
    data: {
      solicitudId: sol3.id,
      estatus: 'APROBADA',
      comentario: 'Asignación de recursos federales y estatales lista.',
      funcionario: 'Administrador Demo'
    }
  });

  // ─── EXPEDIENTE 4: MAQUINARIA ───────────────────────────────
  const prod4 = await prisma.productor.create({
    data: {
      tipoPersona: 'MORAL',
      nombreOrganizacion: 'Rancho Agricola Nayar S. de R.L.',
      representante: 'Federico Altamirano',
      rfc: 'RAN980712ABC',
      domicilio: 'Km 12 Carretera Tepic-Mazatlán',
      municipio: 'Tepic',
      localidad: 'Francisco I. Madero',
      indigena: 'NO',
      discapacidad: 'NO'
    }
  });

  const apoyo4 = await prisma.apoyoControl.create({
    data: {
      conceptoApoyo: 'Tractor Agrícola 90HP',
      cantidad: 1,
      unidadMedida: 'Equipo',
      montoTotal: 950000,
      aportacionPrograma: 600000,
      aportacionSolicitante: 350000,
      aportacionEstatal: 0,
      aportacionFederal: 0,
      gradoMarginacion: 'Bajo',
      tenenciaTierra: 'Propiedad Privada',
      estatus: 'PAGADA',
      priorizacion: 'Media',
      dictamen: 'Procedente',
      trimestre: 'Segundo'
    }
  });

  const sol4 = await prisma.solicitud.create({
    data: {
      folio: 'SDR-NY-2026-0004',
      programa: 'Equipamiento Rural y Centrales de Maquinaria',
      componente: 'Adquisición de Tractores y Rastrillas',
      moduloTipo: 'MAQUINARIA',
      status: 'PAGADA',
      productorId: prod4.id,
      apoyoControlId: apoyo4.id,
      ineUrl: '/uploads/ine-demo.pdf',
      curpUrl: '/uploads/curp-demo.pdf',
      rfcUrl: '/uploads/rfc-demo.pdf',
      comprobanteUrl: '/uploads/comprobante-demo.pdf',
      facturaUrl: '/uploads/factura-demo.pdf'
    }
  });

  await prisma.datosMaquinaria.create({
    data: {
      solicitudId: sol4.id,
      tractor: 'John Deere 5090E',
      ramaProductiva: 'Granos básicos',
      plazoSolicitado: 'Abono anual a 3 años',
      nombreContacto: 'Federico Altamirano',
      telefonoContacto: '3111234567'
    }
  });

  await prisma.historialEstatus.create({
    data: {
      solicitudId: sol4.id,
      estatus: 'PAGADA',
      comentario: 'Monto de aportación gubernamental depositado al proveedor.',
      funcionario: 'Secretario SDR'
    }
  });

  // ─── EXPEDIENTE 5: INFRAESTRUCTURA ──────────────────────────
  const prod5 = await prisma.productor.create({
    data: {
      tipoPersona: 'MORAL',
      nombreOrganizacion: 'Asociación Canal de Riego Margen Izquierda',
      representante: 'Manuel Cardenas',
      rfc: 'AUC101112MNO',
      domicilio: 'Domicilio Conocido Chilapa',
      municipio: 'Rosamorada',
      localidad: 'Chilapa',
      indigena: 'NO',
      discapacidad: 'NO'
    }
  });

  const apoyo5 = await prisma.apoyoControl.create({
    data: {
      conceptoApoyo: 'Rehabilitación de compuertas del canal principal',
      cantidad: 1,
      unidadMedida: 'Obra',
      montoTotal: 1200000,
      aportacionPrograma: 1000000,
      aportacionSolicitante: 200000,
      aportacionEstatal: 0,
      aportacionFederal: 0,
      gradoMarginacion: 'Medio',
      tenenciaTierra: 'Mancomún',
      estatus: 'FINALIZADA',
      priorizacion: 'Alta',
      dictamen: 'Procedente',
      trimestre: 'Segundo'
    }
  });

  const sol5 = await prisma.solicitud.create({
    data: {
      folio: 'SDR-NY-2026-0005',
      programa: 'Programa de Infraestructura y Obras Rurales (SDR-INFR)',
      componente: 'Rehabilitación y Preservación Hidroagrícola',
      moduloTipo: 'INFRAESTRUCTURA',
      status: 'FINALIZADA',
      productorId: prod5.id,
      apoyoControlId: apoyo5.id,
      ineUrl: '/uploads/ine-demo.pdf',
      curpUrl: '/uploads/curp-demo.pdf',
      rfcUrl: '/uploads/rfc-demo.pdf',
      comprobanteUrl: '/uploads/comprobante-demo.pdf',
      facturaUrl: '/uploads/factura-demo.pdf'
    }
  });

  await prisma.datosInfraestructura.create({
    data: {
      solicitudId: sol5.id,
      domicilioUnidadDistritoRiego: 'Canal Lateral Kilómetro 14',
      municipio: 'Rosamorada',
      localidad: 'Chilapa',
      concesionAgua: 'CONAGUA-DIST-REG-043',
      actaConstitutiva: 'Acta 1092 Vol 45'
    }
  });

  await prisma.historialEstatus.create({
    data: {
      solicitudId: sol5.id,
      estatus: 'FINALIZADA',
      comentario: 'Obra hidráulica inspeccionada y entregada con acta de entrega-recepción.',
      funcionario: 'Administrador Demo'
    }
  });

  // ─── EXPEDIENTE 6: MEDIOS ───────────────────────────────────
  const sol6 = await prisma.solicitud.create({
    data: {
      folio: 'SDR-NY-2026-0006',
      programa: 'Difusión de Acciones y Reporte de Medios',
      componente: 'Cobertura de Prensa Oficial',
      moduloTipo: 'MEDIOS',
      status: 'REGISTRADA'
    }
  });

  await prisma.datosMedios.create({
    data: {
      solicitudId: sol6.id,
      subsecretaria: 'Subsecretaría de Desarrollo Rural',
      direccionDepartamento: 'Dirección de Comunicación y Relaciones Públicas',
      tipoReporte: 'Reporte de Prensa',
      fecha: new Date(),
      lugar: 'Palacio de Gobierno',
      municipio: 'Tepic',
      localidad: 'Tepic Centro',
      asuntoTema: 'Rueda de prensa para el arranque del ciclo agrícola otoño-invierno',
      quienesIntervienen: 'Gobernador del Estado, Secretario de Desarrollo Rural',
      reporteResumen: 'Se informaron las bases de apoyo para la semilla subsidiada de frijol y el padrón de beneficiarios autorizados.'
    }
  });

  await prisma.historialEstatus.create({
    data: {
      solicitudId: sol6.id,
      estatus: 'REGISTRADA',
      comentario: 'Reporte de prensa registrado en el sistema de medios SDR.',
      funcionario: 'Comunicaciones SDR'
    }
  });

  // ─── EXPEDIENTE 7: TEMAS IMPORTANTES ────────────────────────
  const sol7 = await prisma.solicitud.create({
    data: {
      folio: 'SDR-NY-2026-0007',
      programa: 'Temas de Impacto y Seguimiento Especial',
      componente: 'Atención a Contingencias y Conflictos',
      moduloTipo: 'TEMAS_IMPORTANTES',
      status: 'REGISTRADA'
    }
  });

  await prisma.datosTemasImportantes.create({
    data: {
      solicitudId: sol7.id,
      tipo: 'GIRA',
      descripcion: 'Gira de trabajo para evaluar afectaciones por inundación en canales de riego',
      areaSeder: 'Despacho del Secretario',
      quienesIntervienen: 'Secretario de Desarrollo Rural, Presidente Municipal de Tecuala',
      comoSeAtiende: 'Reunión de concertación y firma de convenio municipal de reparación',
      inversion: '350000',
      productoresApoyados: '150',
      hectareasApoyadas: '450',
      municipiosApoyados: 'Tecuala',
      reporteResumen: 'Evaluación física de canales en zona norte y firma de convenios para el arranque del dragado de urgencia.'
    }
  });

  await prisma.historialEstatus.create({
    data: {
      solicitudId: sol7.id,
      estatus: 'REGISTRADA',
      comentario: 'Tema de impacto registrado bajo el folio prioritario.',
      funcionario: 'Despacho Secretario'
    }
  });

  // ─── EXPEDIENTE 8: AGRICULTURA ──────────────────────────────
  const prod8 = await prisma.productor.create({
    data: {
      tipoPersona: 'FISICA',
      nombre: 'Jose Francisco',
      apellidoPaterno: 'Delgado',
      apellidoMaterno: 'Meza',
      rfc: 'DEMJ820303XYZ',
      curp: 'DEFJ820303HNTXXR08',
      genero: 'Hombre',
      domicilio: 'Av. Hidalgo 112, Quimichis',
      municipio: 'Tecuala',
      localidad: 'Quimichis',
      indigena: 'NO',
      discapacidad: 'NO'
    }
  });

  const apoyo8 = await prisma.apoyoControl.create({
    data: {
      conceptoApoyo: 'Semilla Certificada Frijol Pinto',
      cantidad: 80,
      unidadMedida: 'Bultos',
      montoTotal: 24000,
      aportacionPrograma: 18000,
      aportacionSolicitante: 6000,
      aportacionEstatal: 0,
      aportacionFederal: 0,
      gradoMarginacion: 'Medio',
      tenenciaTierra: 'Ejidal',
      estatus: 'DICTAMINADA',
      priorizacion: 'Media',
      dictamen: 'Procedente',
      trimestre: 'Primer'
    }
  });

  const sol8 = await prisma.solicitud.create({
    data: {
      folio: 'SDR-NY-2026-0008',
      programa: 'Programa de Fomento Agrícola (SDR-AGRI)',
      componente: 'Semilla Subsidiada Ciclo O-I',
      moduloTipo: 'AGRICULTURA_FRIJOL',
      status: 'DICTAMINADA',
      productorId: prod8.id,
      apoyoControlId: apoyo8.id,
      ineUrl: '/uploads/ine-demo.pdf',
      curpUrl: '/uploads/curp-demo.pdf',
      rfcUrl: '/uploads/rfc-demo.pdf',
      comprobanteUrl: '/uploads/comprobante-demo.pdf',
      facturaUrl: '/uploads/factura-demo.pdf'
    }
  });

  await prisma.datosAgriculturaFrijol.create({
    data: {
      solicitudId: sol8.id,
      municipioActa: 'Tecuala',
      localidadActa: 'Quimichis',
      fechaActa: new Date(),
      variedadSemillaCertificada: 'Pinto Saltillo',
      cantidadAutorizadaKg: 4000,
      superficieAutorizadaHa: 8,
      tituloPropiedad: 'Certificado Parcelario 00000021345',
      numeroDocumento: 'DOC-123'
    }
  });

  await prisma.historialEstatus.create({
    data: {
      solicitudId: sol8.id,
      estatus: 'DICTAMINADA',
      comentario: 'Solicitud dictaminada como procedente.',
      funcionario: 'Administrador Demo'
    }
  });

  // ─── EXPEDIENTE 9: GANADERIA ────────────────────────────────
  const prod9 = await prisma.productor.create({
    data: {
      tipoPersona: 'FISICA',
      nombre: 'Luisa Fernanda',
      apellidoPaterno: 'Torres',
      apellidoMaterno: 'Castillo',
      rfc: 'TOCL880404XYZ',
      curp: 'TOLL880404MNTXXR09',
      genero: 'Mujer',
      domicilio: 'Calle Zaragoza 89, Las Varas',
      municipio: 'Compostela',
      localidad: 'Las Varas',
      indigena: 'NO',
      discapacidad: 'NO'
    }
  });

  const apoyo9 = await prisma.apoyoControl.create({
    data: {
      conceptoApoyo: 'Picadora de Forraje con motor a gasolina',
      cantidad: 1,
      unidadMedida: 'Equipo',
      montoTotal: 32000,
      aportacionPrograma: 20000,
      aportacionSolicitante: 12000,
      aportacionEstatal: 0,
      aportacionFederal: 0,
      gradoMarginacion: 'Bajo',
      tenenciaTierra: 'Propiedad Privada',
      estatus: 'APROBADA',
      priorizacion: 'Media',
      dictamen: 'Procedente',
      trimestre: 'Primer'
    }
  });

  const sol9 = await prisma.solicitud.create({
    data: {
      folio: 'SDR-NY-2026-0009',
      programa: 'Programa de Desarrollo Ganadero (SDR-GANA)',
      componente: 'Infraestructura y Forrajes',
      moduloTipo: 'GANADERIA',
      status: 'APROBADA',
      productorId: prod9.id,
      apoyoControlId: apoyo9.id,
      ineUrl: '/uploads/ine-demo.pdf',
      curpUrl: '/uploads/curp-demo.pdf',
      rfcUrl: '/uploads/rfc-demo.pdf',
      comprobanteUrl: '/uploads/comprobante-demo.pdf',
      facturaUrl: '/uploads/factura-demo.pdf'
    }
  });

  await prisma.datosGanaderia.create({
    data: {
      solicitudId: sol9.id,
      nombrePredio: 'Rincón del Toro',
      municipio: 'Compostela',
      localidad: 'Las Varas',
      upp: '18-005-01024-03',
      latitudN: '21.1234 N',
      longitudW: '105.1234 W',
      inventarioGanadero: '12 cabezas de ganado bovino productor de leche'
    }
  });

  await prisma.historialEstatus.create({
    data: {
      solicitudId: sol9.id,
      estatus: 'APROBADA',
      comentario: 'Monto aprobado por el comité.',
      funcionario: 'Administrador Demo'
    }
  });

  // ─── EXPEDIENTE 10: MAQUINARIA ──────────────────────────────
  const prod10 = await prisma.productor.create({
    data: {
      tipoPersona: 'FISICA',
      nombre: 'Carlos Alberto',
      apellidoPaterno: 'Mendez',
      apellidoMaterno: 'Rios',
      rfc: 'MERC651212XYZ',
      curp: 'MECC651212HNTXXR10',
      genero: 'Hombre',
      domicilio: 'Camino Real s/n, Pantanal',
      municipio: 'Xalisco',
      localidad: 'Pantanal',
      indigena: 'NO',
      discapacidad: 'NO'
    }
  });

  const apoyo10 = await prisma.apoyoControl.create({
    data: {
      conceptoApoyo: 'Rastra Agrícola de 24 Discos',
      cantidad: 1,
      unidadMedida: 'Equipo',
      montoTotal: 115000,
      aportacionPrograma: 70000,
      aportacionSolicitante: 45000,
      aportacionEstatal: 0,
      aportacionFederal: 0,
      gradoMarginacion: 'Medio',
      tenenciaTierra: 'Propiedad Privada',
      estatus: 'EN REVISIÓN',
      priorizacion: 'Media',
      dictamen: 'Sin Dictamen',
      trimestre: 'Primer'
    }
  });

  const sol10 = await prisma.solicitud.create({
    data: {
      folio: 'SDR-NY-2026-0010',
      programa: 'Equipamiento Rural y Centrales de Maquinaria',
      componente: 'Adquisición de Tractores y Rastrillas',
      moduloTipo: 'MAQUINARIA',
      status: 'EN REVISIÓN',
      productorId: prod10.id,
      apoyoControlId: apoyo10.id
    }
  });

  await prisma.datosMaquinaria.create({
    data: {
      solicitudId: sol10.id,
      rastra: 'Rastra tiro hidraulico 24D',
      ramaProductiva: 'Aguacate y frutales',
      plazoSolicitado: 'Contado',
      nombreContacto: 'Carlos Méndez',
      telefonoContacto: '3119876543'
    }
  });

  await prisma.historialEstatus.create({
    data: {
      solicitudId: sol10.id,
      estatus: 'REGISTRADA',
      comentario: 'Solicitud capturada.',
      funcionario: 'Administrador Demo'
    }
  });

  console.log('Siembra de los 10 expedientes de demostración finalizada con éxito.');
}

main()
  .catch((e) => {
    console.error('Error durante la siembra de expedientes demo:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
