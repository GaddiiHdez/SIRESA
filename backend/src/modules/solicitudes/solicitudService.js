import prisma from '../../shared/config/db.js';

// Helper: convierte string vacío o null → undefined
const nn = (v) => (v === null || v === undefined || v === '') ? undefined : v;

// Generar Folio Oficial: SDR-NY-AAAA-NNNN
async function generarFolio(tx) {
  const year = new Date().getFullYear();
  
  // Contar cuántas solicitudes se registraron este año usando la transacción
  const count = await tx.solicitud.count({
    where: {
      fechaRegistro: {
        gte: new Date(`${year}-01-01T00:00:00.000Z`),
        lt: new Date(`${year + 1}-01-01T00:00:00.000Z`)
      }
    }
  });

  const nextNum = String(count + 1).padStart(4, '0');
  return `SDR-NY-${year}-${nextNum}`;
}

export async function createSolicitud(data, user) {
  const {
    fechaRegistro,
    fechaSolicitud,
    programa,
    componente,
    moduloTipo,
    productor,
    apoyoControl,
    datosEspecif,
    ineUrl,
    curpUrl,
    rfcUrl,
    comprobanteUrl,
    facturaUrl
  } = data;

  return await prisma.$transaction(async (tx) => {
    // 0. Bloqueo consultivo exclusivo para serializar la generación de folios
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(20260707)`;

    // 1. Crear Productor (si se provee)
    let nuevoProductor = null;
    if (productor) {
      nuevoProductor = await tx.productor.create({
        data: {
          tipoPersona: productor.tipoPersona,
          nombre: nn(productor.nombre),
          apellidoPaterno: nn(productor.apellidoPaterno),
          apellidoMaterno: nn(productor.apellidoMaterno),
          nombreOrganizacion: nn(productor.nombreOrganizacion),
          representante: nn(productor.representante),
          rfc: nn(productor.rfc),
          curp: nn(productor.curp),
          genero: nn(productor.genero),
          indigena: productor.indigena || 'NO',
          etnia: nn(productor.etnia),
          discapacidad: productor.discapacidad || 'NO',
          tipoDiscapacidad: nn(productor.tipoDiscapacidad),
          beneficiariosHombres: productor.beneficiariosHombres ? parseInt(productor.beneficiariosHombres) : undefined,
          beneficiariosMujeres: productor.beneficiariosMujeres ? parseInt(productor.beneficiariosMujeres) : undefined,
          tipoIdentificacion: nn(productor.tipoIdentificacion),
          folioIdentificacion: nn(productor.folioIdentificacion),
          domicilio: productor.domicilio,
          telefono: nn(productor.telefono),
          municipio: productor.municipio,
          localidad: productor.localidad
        }
      });
    }

    // 2. Generar Folio
    const folio = await generarFolio(tx);

    // 3. Crear Apoyo Control (si se provee)
    let nuevoApoyo = null;
    if (apoyoControl) {
      nuevoApoyo = await tx.apoyoControl.create({
        data: {
          gradoMarginacion: apoyoControl.gradoMarginacion || 'Medio',
          superficie: apoyoControl.superficie ? parseFloat(apoyoControl.superficie) : undefined,
          tenenciaTierra: nn(apoyoControl.tenenciaTierra),
          conceptoApoyo: apoyoControl.conceptoApoyo,
          indigo: apoyoControl.indigo ? String(apoyoControl.indigo) : undefined,
          unidadMedida: apoyoControl.unidadMedida,
          cantidad: parseFloat(apoyoControl.cantidad || '0'),
          especificacionApoyo: nn(apoyoControl.especificacionApoyo),
          montoTotal: parseFloat(apoyoControl.montoTotal || '0'),
          aportacionPrograma: parseFloat(apoyoControl.aportacionPrograma || '0'),
          aportacionSolicitante: parseFloat(apoyoControl.aportacionSolicitante || '0'),
          aportacionEstatal: parseFloat(apoyoControl.aportacionEstatal || '0'),
          aportacionFederal: parseFloat(apoyoControl.aportacionFederal || '0'),
          estatus: 'REGISTRADA',
          priorizacion: apoyoControl.priorizacion || 'Media',
          dictamen: apoyoControl.dictamen || 'Sin Dictamen',
          comentarioDictamen: nn(apoyoControl.comentarioDictamen),
          sesionOd: nn(apoyoControl.sesionOd),
          fechaSesionOd: apoyoControl.fechaSesionOd ? new Date(apoyoControl.fechaSesionOd) : undefined,
          factura: nn(apoyoControl.factura),
          proveedor: nn(apoyoControl.proveedor),
          rfcProveedor: nn(apoyoControl.rfcProveedor),
          montoPagado: apoyoControl.montoPagado ? parseFloat(apoyoControl.montoPagado) : undefined,
          economia: apoyoControl.economia ? parseFloat(apoyoControl.economia) : undefined,
          fechaPago: apoyoControl.fechaPago ? new Date(apoyoControl.fechaPago) : undefined,
          trimestre: apoyoControl.trimestre || 'Primer'
        }
      });
    }

    // 4. Crear Solicitud Base
    const nuevaSolicitud = await tx.solicitud.create({
      data: {
        folio,
        fechaRegistro: fechaRegistro ? new Date(fechaRegistro) : new Date(),
        fechaSolicitud: fechaSolicitud ? new Date(fechaSolicitud) : new Date(),
        programa,
        componente,
        moduloTipo,
        status: 'REGISTRADA',
        productorId: nuevoProductor ? nuevoProductor.id : undefined,
        apoyoControlId: nuevoApoyo ? nuevoApoyo.id : undefined,
        ineUrl: nn(ineUrl),
        curpUrl: nn(curpUrl),
        rfcUrl: nn(rfcUrl),
        comprobanteUrl: nn(comprobanteUrl),
        facturaUrl: nn(facturaUrl)
      }
    });

    // 5. Crear Historial Estatus Inicial
    await tx.historialEstatus.create({
      data: {
        solicitudId: nuevaSolicitud.id,
        estatus: 'REGISTRADA',
        comentario: 'Expediente digitalizado y registrado en sistema.',
        funcionario: user?.name || 'Funcionario SEDER'
      }
    });

    // 6. Crear Registro Técnico de Módulo Específico
    if (moduloTipo === 'GANADERIA') {
      await tx.datosGanaderia.create({
        data: {
          solicitudId: nuevaSolicitud.id,
          nombrePredio: datosEspecif.nombrePredio,
          municipio: datosEspecif.municipio || productor?.municipio,
          localidad: datosEspecif.localidad || productor?.localidad,
          upp: datosEspecif.upp,
          latitudN: datosEspecif.latitudN,
          longitudW: datosEspecif.longitudW,
          credencialGanadera: nn(datosEspecif.credencialGanadera),
          inventarioGanadero: nn(datosEspecif.inventarioGanadero)
        }
      });
    } else if (moduloTipo === 'AGRICULTURA_FRIJOL') {
      await tx.datosAgriculturaFrijol.create({
        data: {
          solicitudId: nuevaSolicitud.id,
          municipioActa: datosEspecif.municipioActa,
          localidadActa: nn(datosEspecif.localidadActa),
          fechaActa: datosEspecif.fechaActa ? new Date(datosEspecif.fechaActa) : undefined,
          variedadSemillaCertificada: datosEspecif.variedadSemillaCertificada,
          cantidadAutorizadaKg: parseInt(datosEspecif.cantidadAutorizadaKg || '0'),
          superficieAutorizadaHa: parseFloat(datosEspecif.superficieAutorizadaHa || '0'),
          numeroBultos: datosEspecif.numeroBultos ? parseInt(datosEspecif.numeroBultos) : undefined,
          tituloPropiedad: nn(datosEspecif.tituloPropiedad),
          numeroDocumento: nn(datosEspecif.numeroDocumento)
        }
      });
    } else if (moduloTipo === 'PESCA_ACUACULTURA') {
      await tx.datosPescaAcuacultura.create({
        data: {
          solicitudId: nuevaSolicitud.id,
          domicilioUnidadProductiva: datosEspecif.domicilioUnidadProductiva,
          municipio: datosEspecif.municipio || productor?.municipio,
          localidad: datosEspecif.localidad || productor?.localidad,
          concesionAgua: nn(datosEspecif.concesionAgua),
          fechaPagoCria: datosEspecif.fechaPagoCria ? new Date(datosEspecif.fechaPagoCria) : undefined,
          permisoPesca: nn(datosEspecif.permisoPesca),
          actaConstitutiva: nn(datosEspecif.actaConstitutiva),
          fechaActaConstitutiva: datosEspecif.fechaActaConstitutiva ? new Date(datosEspecif.fechaActaConstitutiva) : undefined,
          rnpa: nn(datosEspecif.rnpa),
          manifestacionImpactoAmbiental: nn(datosEspecif.manifestacionImpactoAmbiental),
          resolucionProfepa: nn(datosEspecif.resolucionProfepa),
          legalPossesion: nn(datosEspecif.legalPossesion),
          facturaBienSustituir: nn(datosEspecif.facturaBienSustituir)
        }
      });
    } else if (moduloTipo === 'INFRAESTRUCTURA') {
      await tx.datosInfraestructura.create({
        data: {
          solicitudId: nuevaSolicitud.id,
          domicilioUnidadDistritoRiego: datosEspecif.domicilioUnidadDistritoRiego,
          municipio: datosEspecif.municipio || productor?.municipio,
          localidad: datosEspecif.localidad || productor?.localidad,
          concesionAgua: nn(datosEspecif.concesionAgua),
          actaConstitutiva: nn(datosEspecif.actaConstitutiva),
          fechaActaConstitutiva: datosEspecif.fechaActaConstitutiva ? new Date(datosEspecif.fechaActaConstitutiva) : undefined
        }
      });
    } else if (moduloTipo === 'MAQUINARIA') {
      await tx.datosMaquinaria.create({
        data: {
          solicitudId: nuevaSolicitud.id,
          tractor: nn(datosEspecif.tractor),
          rastra: nn(datosEspecif.rastra),
          sc: nn(datosEspecif.sc),
          sp: nn(datosEspecif.sp),
          rf: nn(datosEspecif.rf),
          rg: nn(datosEspecif.rg),
          en: nn(datosEspecif.en),
          em: nn(datosEspecif.em),
          cribadora: nn(datosEspecif.cribadora),
          b: nn(datosEspecif.b),
          mf: nn(datosEspecif.mf),
          cg: nn(datosEspecif.cg),
          niv: nn(datosEspecif.niv),
          pps: nn(datosEspecif.pps),
          transporte: nn(datosEspecif.transporte),
          otro: nn(datosEspecif.otro),
          fechaSolicitada: datosEspecif.fechaSolicitada ? new Date(datosEspecif.fechaSolicitada) : undefined,
          ramaProductiva: nn(datosEspecif.ramaProductiva),
          plazoSolicitado: nn(datosEspecif.plazoSolicitado),
          fecha1: nn(datosEspecif.fecha1),
          fecha2: nn(datosEspecif.fecha2),
          nombreContacto: nn(datosEspecif.nombreContacto),
          telefonoContacto: nn(datosEspecif.telefonoContacto)
        }
      });
    } else if (moduloTipo === 'MEDIOS') {
      await tx.datosMedios.create({
        data: {
          solicitudId: nuevaSolicitud.id,
          subsecretaria: datosEspecif.subsecretaria,
          direccionDepartamento: nn(datosEspecif.direccionDepartamento),
          tipoReporte: datosEspecif.tipoReporte,
          fecha: datosEspecif.fecha ? new Date(datosEspecif.fecha) : new Date(),
          lugar: nn(datosEspecif.lugar),
          municipio: nn(datosEspecif.municipio),
          localidad: nn(datosEspecif.localidad),
          asuntoTema: datosEspecif.asuntoTema,
          quienesIntervienen: nn(datosEspecif.quienesIntervienen),
          reporteResumen: datosEspecif.reporteResumen,
          archivosMaterial: nn(datosEspecif.archivosMaterial)
        }
      });
    } else if (moduloTipo === 'TEMAS_IMPORTANTES') {
      await tx.datosTemasImportantes.create({
        data: {
          solicitudId: nuevaSolicitud.id,
          tipo: datosEspecif.tipo,
          descripcion: datosEspecif.descripcion,
          areaSeder: nn(datosEspecif.areaSeder),
          quienesIntervienen: nn(datosEspecif.quienesIntervienen),
          comoSeAtiende: datosEspecif.comoSeAtiende,
          inversion: datosEspecif.inversion ? String(datosEspecif.inversion) : undefined,
          distribucion: nn(datosEspecif.distribucion),
          productoresApoyados: datosEspecif.productoresApoyados ? String(datosEspecif.productoresApoyados) : undefined,
          hectareasApoyadas: datosEspecif.hectareasApoyadas ? String(datosEspecif.hectareasApoyadas) : undefined,
          beneficioAhorro: nn(datosEspecif.beneficioAhorro),
          municipiosApoyados: nn(datosEspecif.municipiosApoyados),
          reporteResumen: datosEspecif.reporteResumen,
          archivosMaterial: nn(datosEspecif.archivosMaterial)
        }
      });
    }

    return nuevaSolicitud;
  });
}

export async function getAllSolicitudes(queryFilters) {
  const { folio, status, programa, curp, municipio, page, limit, moduloTipo, genero, tipoPersona, fechaInicio, fechaFin } = queryFilters;

  const where = {};
  if (folio) {
    where.folio = { contains: folio, mode: 'insensitive' };
  }
  if (status) {
    if (status.includes(',')) {
      where.status = { in: status.split(',') };
    } else {
      where.status = status;
    }
  }
  if (programa) {
    where.programa = { contains: programa, mode: 'insensitive' };
  }
  if (moduloTipo) {
    where.moduloTipo = moduloTipo;
  }

  if (fechaInicio || fechaFin) {
    where.fechaRegistro = {};
    if (fechaInicio) {
      where.fechaRegistro.gte = new Date(`${fechaInicio}T00:00:00.000Z`);
    }
    if (fechaFin) {
      where.fechaRegistro.lte = new Date(`${fechaFin}T23:59:59.999Z`);
    }
  }

  if (curp || municipio || genero || tipoPersona) {
    where.productor = {};
    if (curp) {
      where.productor.OR = [
        { curp: { contains: curp, mode: 'insensitive' } },
        { rfc: { contains: curp, mode: 'insensitive' } }
      ];
    }
    if (municipio) {
      where.productor.municipio = { contains: municipio, mode: 'insensitive' };
    }
    if (genero) {
      where.productor.genero = genero;
    }
    if (tipoPersona) {
      where.productor.tipoPersona = tipoPersona;
    }
  }

  const pageNum = Math.max(1, parseInt(page) || 1);
  const limitNum = Math.min(100, Math.max(1, parseInt(limit) || 50));
  const totalItems = await prisma.solicitud.count({ where });
  const totalPages = Math.ceil(totalItems / limitNum);
  const skip = (pageNum - 1) * limitNum;

  const solicitudes = await prisma.solicitud.findMany({
    where,
    include: {
      productor: true,
      apoyoControl: true
    },
    orderBy: {
      fechaRegistro: 'desc'
    },
    take: limitNum,
    skip: skip
  });

  return {
    totalItems,
    totalPages,
    pageNum,
    limitNum,
    solicitudes
  };
}

export async function getSolicitudById(id) {
  return await prisma.solicitud.findUnique({
    where: { id },
    include: {
      productor: true,
      apoyoControl: true,
      historialEstatus: {
        orderBy: { fechaChange: 'desc' }
      },
      datosGanaderia: true,
      datosAgriculturaFrijol: true,
      datosPescaAcuacultura: true,
      datosInfraestructura: true,
      datosMaquinaria: true,
      datosMedios: true,
      datosTemasImportantes: true
    }
  });
}

export async function updateSolicitudEstatus(id, estatus, comentario, user) {
  const solicitudActual = await prisma.solicitud.findUnique({
    where: { id }
  });

  if (!solicitudActual) {
    throw new Error('Solicitud no encontrada.');
  }

  const VALID_TRANSITIONS = {
    'REGISTRADA': ['EN REVISIÓN', 'DICTAMINADA', 'FINALIZADA'],
    'EN REVISIÓN': ['REGISTRADA', 'DICTAMINADA', 'FINALIZADA'],
    'DICTAMINADA': ['EN REVISIÓN', 'APROBADA', 'FINALIZADA'],
    'APROBADA': ['DICTAMINADA', 'PAGADA', 'FINALIZADA'],
    'PAGADA': ['APROBADA', 'FINALIZADA'],
    'FINALIZADA': []
  };

  const currentStatus = solicitudActual.status;
  const allowed = VALID_TRANSITIONS[currentStatus] || [];

  if (currentStatus !== estatus && !allowed.includes(estatus)) {
    throw new Error(`Transición de estatus no permitida: no se puede cambiar de "${currentStatus}" a "${estatus}".`);
  }

  // Si pasa a dictamen o posterior, validar que tenga toda la documentación obligatoria cargada
  if (['DICTAMINADA', 'APROBADA', 'PAGADA', 'FINALIZADA'].includes(estatus)) {
    if (solicitudActual.moduloTipo !== 'MEDIOS' && solicitudActual.moduloTipo !== 'TEMAS_IMPORTANTES') {
      if (!solicitudActual.ineUrl || !solicitudActual.curpUrl || !solicitudActual.rfcUrl || !solicitudActual.comprobanteUrl || !solicitudActual.facturaUrl) {
        throw new Error('No se puede cambiar a un estatus avanzado: faltan documentos obligatorios en este expediente.');
      }
    }
  }

  return await prisma.$transaction(async (tx) => {
    // Actualizar Solicitud base
    const solActualizada = await tx.solicitud.update({
      where: { id },
      data: { status: estatus }
    });

    // Actualizar Apoyo Control (solo si existe)
    if (solicitudActual.apoyoControlId) {
      await tx.apoyoControl.update({
        where: { id: solicitudActual.apoyoControlId },
        data: { estatus }
      });
    }

    // Insertar Bitácora de historial
    await tx.historialEstatus.create({
      data: {
        solicitudId: id,
        estatus,
        comentario: comentario || `Estatus cambiado a ${estatus}.`,
        funcionario: user?.name || 'Funcionario SEDER'
      }
    });

    return solActualizada;
  });
}

export async function updateSolicitudDocumentos(id, documents) {
  const { ineUrl, curpUrl, rfcUrl, comprobanteUrl, facturaUrl } = documents;

  return await prisma.solicitud.update({
    where: { id },
    data: {
      ineUrl: nn(ineUrl),
      curpUrl: nn(curpUrl),
      rfcUrl: nn(rfcUrl),
      comprobanteUrl: nn(comprobanteUrl),
      facturaUrl: nn(facturaUrl)
    }
  });
}

export async function getStatsDashboard() {
  const totalSolicitudes = await prisma.solicitud.count();
  
  const sumas = await prisma.apoyoControl.aggregate({
    _sum: {
      montoTotal: true
    }
  });

  const sumasAprobadas = await prisma.apoyoControl.aggregate({
    _sum: {
      montoTotal: true
    },
    where: {
      estatus: { in: ['APROBADA', 'PAGADA', 'FINALIZADA'] }
    }
  });

  const beneficiariosHombres = await prisma.productor.count({
    where: { tipoPersona: 'FISICA', genero: 'Hombre' }
  });

  const beneficiariosMujeres = await prisma.productor.count({
    where: { tipoPersona: 'FISICA', genero: 'Mujer' }
  });

  const organizaciones = await prisma.productor.count({
    where: { tipoPersona: { in: ['MORAL', 'GRUPO'] } }
  });

  const estatusGroup = await prisma.solicitud.groupBy({
    by: ['status'],
    _count: {
      id: true
    }
  });

  const modulosGroup = await prisma.$queryRaw`
    SELECT s."moduloTipo" as modulo, COUNT(s.id)::int as count, COALESCE(SUM(a."montoTotal")::float, 0) as inversion
    FROM "Solicitud" s
    LEFT JOIN "ApoyoControl" a ON s."apoyoControlId" = a.id
    GROUP BY s."moduloTipo"
  `;

  // Leer presupuestos sectoriales reales de la base de datos
  const presupuestosBd = await prisma.presupuestoSector.findMany();

  const modulosConPresupuesto = presupuestosBd.map(p => {
    const dbModulo = modulosGroup.find(m => m.modulo === p.sector);
    return {
      modulo: p.sector,
      count: dbModulo ? dbModulo.count : 0,
      inversion: dbModulo ? dbModulo.inversion : 0,
      presupuestoAsignado: Number(p.montoAsignado)
    };
  });

  // Agregar sectores que están en modulosGroup pero no tienen presupuesto asignado en la BD (ej. MEDIOS)
  modulosGroup.forEach(m => {
    const existe = modulosConPresupuesto.some(p => p.modulo === m.modulo);
    if (!existe) {
      modulosConPresupuesto.push({
        modulo: m.modulo,
        count: m.count,
        inversion: m.inversion,
        presupuestoAsignado: 0
      });
    }
  });

  const municipioInversiones = await prisma.$queryRaw`
    SELECT p.municipio, COUNT(s.id)::int as count, SUM(a."montoTotal")::float as inversion
    FROM "Solicitud" s
    JOIN "Productor" p ON s."productorId" = p.id
    JOIN "ApoyoControl" a ON s."apoyoControlId" = a.id
    GROUP BY p.municipio
    ORDER BY inversion DESC
  `;

  const localidadInversiones = await prisma.$queryRaw`
    SELECT p.municipio, p.localidad, COUNT(s.id)::int as count, SUM(a."montoTotal")::float as inversion
    FROM "Solicitud" s
    JOIN "Productor" p ON s."productorId" = p.id
    JOIN "ApoyoControl" a ON s."apoyoControlId" = a.id
    WHERE p.localidad IS NOT NULL AND p.localidad <> ''
    GROUP BY p.municipio, p.localidad
    ORDER BY inversion DESC
  `;

  const municipiosConLocalidades = municipioInversiones.map(m => ({
    ...m,
    localidades: localidadInversiones.filter(l => l.municipio === m.municipio)
  }));

  return {
    resumen: {
      totalSolicitudes,
      inversionTotal: sumas._sum.montoTotal || 0,
      inversionAprobada: sumasAprobadas._sum.montoTotal || 0,
      beneficiarios: {
        hombres: beneficiariosHombres,
        mujeres: beneficiariosMujeres,
        organizaciones,
        total: beneficiariosHombres + beneficiariosMujeres + organizaciones
      }
    },
    estatus: estatusGroup.map(g => ({ status: g.status, count: g._count.id })),
    modulos: modulosConPresupuesto,
    municipios: municipiosConLocalidades
  };
}

export async function getProductoresList() {
  return prisma.productor.findMany({
    include: {
      solicitud: {
        select: {
          id: true,
          folio: true,
          moduloTipo: true,
          status: true
        }
      }
    },
    orderBy: {
      createdAt: 'desc'
    }
  });
}
