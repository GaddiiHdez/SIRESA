/**
 * ============================================================
 * Módulo de Solicitudes — Servicio de Negocio
 * ============================================================
 *
 * Contiene toda la lógica de negocio relacionada con los expedientes
 * de solicitudes de apoyo. Este archivo es el más importante del backend.
 *
 * Funciones exportadas:
 *  - createSolicitud()          → Registro completo de un expediente (transacción)
 *  - getAllSolicitudes()         → Listado paginado con filtros dinámicos
 *  - getSolicitudById()         → Detalle completo de un expediente
 *  - updateSolicitudEstatus()   → Cambio de estatus con validación de flujo
 *  - updateSolicitudDocumentos()→ Actualización de URLs de documentos
 *  - getStatsDashboard()        → Estadísticas agregadas para el dashboard
 *  - getProductoresList()       → Padrón de productores
 */

import prisma from '../../shared/config/db.js';

/**
 * Convierte valores vacíos, null o undefined en `undefined`.
 * Esto evita que Prisma guarde cadenas vacías en campos opcionales
 * y en su lugar deje el campo como NULL en la base de datos.
 *
 * @param {*} v - Valor a evaluar
 * @returns {*} El valor original o `undefined` si estaba vacío/null
 */
const nullToUndefined = (v) => (v === null || v === undefined || v === '') ? undefined : v;

// Alias corto para uso interno frecuente
const nn = nullToUndefined;

// ─── Generación de Folio ───────────────────────────────────────────────────────

/**
 * Genera el siguiente folio oficial del año en curso.
 * Formato: SDR-NY-AAAA-NNNN (ej: SDR-NY-2026-0042)
 *
 * Se ejecuta DENTRO de la transacción de creación con un
 * bloqueo de asesoría de PostgreSQL (pg_advisory_xact_lock)
 * para garantizar que dos expedientes simultáneos no generen
 * el mismo número de folio.
 *
 * @param {PrismaTransactionClient} tx - Cliente de transacción de Prisma
 * @returns {Promise<string>} El folio generado (ej: "SDR-NY-2026-0042")
 */
async function generarFolio(tx) {
  const year = new Date().getFullYear();

  // Contar cuántas solicitudes existen en el año actual (dentro de la transacción)
  const count = await tx.solicitud.count({
    where: {
      fechaRegistro: {
        gte: new Date(`${year}-01-01T00:00:00.000Z`),
        lt: new Date(`${year + 1}-01-01T00:00:00.000Z`)
      }
    }
  });

  // El número consecutivo se rellena con ceros a la izquierda (mínimo 4 dígitos)
  const nextNum = String(count + 1).padStart(4, '0');
  return `SDR-NY-${year}-${nextNum}`;
}

// ─── Creación de Expediente ────────────────────────────────────────────────────

/**
 * Registra un nuevo expediente completo en la base de datos.
 *
 * Ejecuta todo dentro de una TRANSACCIÓN para garantizar atomicidad:
 * si cualquier paso falla, se revierte todo y no quedan datos huérfanos.
 *
 * Pasos de la transacción:
 *  0. Bloqueo exclusivo de folio (evita duplicados en concurrencia)
 *  1. Crear registro del Productor (si se proporcionó)
 *  2. Generar el Folio oficial
 *  3. Crear el registro de Apoyo y Control económico (si se proporcionó)
 *  4. Crear la Solicitud base con el folio generado
 *  5. Insertar el primer registro en el historial de estatus
 *  6. Crear el registro técnico del módulo específico (Ganadería, Pesca, etc.)
 *
 * @param {Object} data - Datos del formulario del frontend
 * @param {Object} user - Usuario autenticado que crea el expediente
 * @returns {Promise<Solicitud>} La solicitud recién creada
 */
export async function createSolicitud(data, user) {
  const {
    fechaRegistro, fechaSolicitud,
    programa, componente, moduloTipo,
    productor, apoyoControl, datosEspecif,
    ineUrl, curpUrl, rfcUrl, comprobanteUrl, facturaUrl
  } = data;

  const result = await prisma.$transaction(async (tx) => {
    // ── Paso 0: Bloqueo exclusivo para serializar generación de folios ─────────
    // pg_advisory_xact_lock adquiere un bloqueo a nivel de transacción que se
    // libera automáticamente al terminar. El número 20260707 es un identificador
    // arbitrario único para este tipo de operación en el sistema.
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(20260707)`;

    // ── Paso 1: Reutilizar o Crear Productor ────────────────────────────────────
    let nuevoProductor = null;
    if (productor) {
      const cleanCurp = productor.curp?.trim()?.toUpperCase();
      const cleanRfc = productor.rfc?.trim()?.toUpperCase();

      let existente = null;
      if (cleanCurp) {
        existente = await tx.productor.findFirst({ where: { curp: cleanCurp } });
      }
      if (!existente && cleanRfc) {
        existente = await tx.productor.findFirst({ where: { rfc: cleanRfc } });
      }

      if (existente) {
        // Reutilizar el perfil de ciudadano u organización existente
        nuevoProductor = await tx.productor.update({
          where: { id: existente.id },
          data: {
            domicilio: productor.domicilio || existente.domicilio,
            telefono: nn(productor.telefono) || existente.telefono,
            municipio: productor.municipio || existente.municipio,
            localidad: productor.localidad || existente.localidad
          }
        });
      } else {
        // Registrar nuevo ciudadano u organización
        nuevoProductor = await tx.productor.create({
          data: {
            tipoPersona: productor.tipoPersona,
            nombre: nn(productor.nombre),
            apellidoPaterno: nn(productor.apellidoPaterno),
            apellidoMaterno: nn(productor.apellidoMaterno),
            nombreOrganizacion: nn(productor.nombreOrganizacion),
            representante: nn(productor.representante),
            rfc: cleanRfc || nn(productor.rfc),
            curp: cleanCurp || nn(productor.curp),
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
    }

    // ── Paso 2: Generar Folio ──────────────────────────────────────────────────
    const folio = await generarFolio(tx);

    // ── Paso 3: Crear Apoyo y Control Económico ────────────────────────────────
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
          // Convertir a float (los formularios envían strings)
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

    // ── Paso 4: Crear Solicitud Base ───────────────────────────────────────────
    const nuevaSolicitud = await tx.solicitud.create({
      data: {
        folio,
        fechaRegistro: fechaRegistro ? new Date(fechaRegistro) : new Date(),
        fechaSolicitud: fechaSolicitud ? new Date(fechaSolicitud) : new Date(),
        programa,
        componente,
        moduloTipo,
        status: 'REGISTRADA', // Estado inicial de todo expediente nuevo
        productorId: nuevoProductor ? nuevoProductor.id : undefined,
        apoyoControlId: nuevoApoyo ? nuevoApoyo.id : undefined,
        // URLs de documentos digitalizados (pueden cargarse después con /documentos)
        ineUrl: nn(ineUrl),
        curpUrl: nn(curpUrl),
        rfcUrl: nn(rfcUrl),
        comprobanteUrl: nn(comprobanteUrl),
        facturaUrl: nn(facturaUrl)
      }
    });

    // ── Paso 5: Registrar primer evento en el historial de estatus ─────────────
    await tx.historialEstatus.create({
      data: {
        solicitudId: nuevaSolicitud.id,
        estatus: 'REGISTRADA',
        comentario: 'Expediente digitalizado y registrado en sistema.',
        funcionario: user?.name || 'Funcionario SEDER'
      }
    });

    // ── Paso 6: Crear datos específicos del módulo ─────────────────────────────
    // Cada módulo productivo tiene su propio modelo de datos con campos únicos.
    // Solo se crea el registro del módulo que corresponde al tipo de solicitud.
    if (moduloTipo === 'GANADERIA') {
      await tx.datosGanaderia.create({
        data: {
          solicitudId: nuevaSolicitud.id,
          nombrePredio: datosEspecif.nombrePredio,
          municipio: datosEspecif.municipio || productor?.municipio,
          localidad: datosEspecif.localidad || productor?.localidad,
          upp: datosEspecif.upp,                    // Unidad de Producción Pecuaria
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
          rnpa: nn(datosEspecif.rnpa),                // Registro Nacional de Pesca y Acuacultura
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
          // Cada campo representa un tipo de maquinaria agrícola solicitada
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

    // Devolver la solicitud base creada (sin los datos relacionados expandidos)
    return nuevaSolicitud;
  });

  // Invalidar la caché del dashboard para reflejar el nuevo registro
  clearStatsCache();

  return result;
}

// ─── Listado con Filtros y Paginación ─────────────────────────────────────────

/**
 * Obtiene un listado paginado de solicitudes con filtros dinámicos.
 *
 * Filtros soportados:
 *  - folio, status, programa, moduloTipo → buscan en la solicitud
 *  - curp, municipio, genero, tipoPersona → filtran por datos del productor
 *  - fechaInicio, fechaFin → rango de fecha de registro
 *  - page, limit → control de paginación
 *
 * @param {Object} queryFilters - Parámetros de consulta de req.query
 * @returns {Object} { totalItems, totalPages, pageNum, limitNum, solicitudes[] }
 */
export async function getAllSolicitudes(queryFilters) {
  const {
    folio, status, programa, curp, municipio,
    page, limit, moduloTipo, genero, tipoPersona,
    fechaInicio, fechaFin
  } = queryFilters;

  // Construir el objeto `where` de Prisma dinámicamente
  // Solo se agregan los filtros que el cliente especificó
  const where = {};

  if (folio) {
    where.folio = { contains: folio, mode: 'insensitive' }; // Búsqueda parcial sin importar mayúsculas
  }

  if (status) {
    // Soporte para filtrar múltiples estatus separados por coma (ej: "REGISTRADA,EN REVISIÓN")
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

  // Filtro por rango de fechas de registro
  if (fechaInicio || fechaFin) {
    where.fechaRegistro = {};
    if (fechaInicio) where.fechaRegistro.gte = new Date(`${fechaInicio}T00:00:00.000Z`);
    if (fechaFin) where.fechaRegistro.lte = new Date(`${fechaFin}T23:59:59.999Z`);
  }

  // Filtros que aplican a datos del productor relacionado
  if (curp || municipio || genero || tipoPersona) {
    where.productor = {};
    if (curp) {
      // Buscar en CURP o en RFC (el campo de búsqueda sirve para ambos)
      where.productor.OR = [
        { curp: { contains: curp, mode: 'insensitive' } },
        { rfc: { contains: curp, mode: 'insensitive' } }
      ];
    }
    if (municipio) where.productor.municipio = { contains: municipio, mode: 'insensitive' };
    if (genero) where.productor.genero = genero;
    if (tipoPersona) where.productor.tipoPersona = tipoPersona;
  }

  // Calcular paginación (siempre positivo, máximo 100 por página)
  const pageNum = Math.max(1, parseInt(page) || 1);
  const limitNum = Math.min(100, Math.max(1, parseInt(limit) || 50));
  const skip = (pageNum - 1) * limitNum;

  // Obtener el total de registros para calcular las páginas totales
  const totalItems = await prisma.solicitud.count({ where });
  const totalPages = Math.ceil(totalItems / limitNum);

  // Consultar la página de resultados incluyendo datos del productor y apoyo económico
  const solicitudes = await prisma.solicitud.findMany({
    where,
    include: {
      productor: true,    // Datos completos del productor/beneficiario
      apoyoControl: true  // Datos económicos del apoyo
    },
    orderBy: { fechaRegistro: 'desc' }, // Más recientes primero
    take: limitNum,
    skip
  });

  return { totalItems, totalPages, pageNum, limitNum, solicitudes };
}

// ─── Detalle de Expediente ─────────────────────────────────────────────────────

/**
 * Obtiene el detalle completo de un expediente por su ID.
 * Incluye todos los datos relacionados: productor, apoyo económico,
 * historial de cambios de estatus y datos del módulo específico.
 *
 * @param {string} id - UUID del expediente
 * @returns {Promise<Solicitud|null>} El expediente o null si no existe
 */
export async function getSolicitudById(id) {
  return await prisma.solicitud.findUnique({
    where: { id },
    include: {
      productor: true,
      apoyoControl: true,
      historialEstatus: {
        orderBy: { fechaChange: 'desc' } // Historial más reciente primero
      },
      // Datos específicos del módulo (solo uno tendrá valor, el resto serán null)
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

// ─── Cambio de Estatus ─────────────────────────────────────────────────────────

/**
 * Cambia el estatus de un expediente siguiendo el flujo de trabajo oficial.
 *
 * Flujo de transiciones válidas:
 *  REGISTRADA → EN REVISIÓN → DICTAMINADA → APROBADA → PAGADA → FINALIZADA
 *
 * Reglas de negocio:
 *  - Solo se permiten las transiciones definidas en VALID_TRANSITIONS
 *  - Para pasar a DICTAMINADA o superior, todos los documentos obligatorios
 *    deben estar cargados (excepto módulos MEDIOS y TEMAS_IMPORTANTES)
 *
 * @param {string} id - UUID del expediente
 * @param {string} estatus - Nuevo estatus a aplicar
 * @param {string} comentario - Comentario del funcionario para el historial
 * @param {Object} user - Usuario autenticado que realiza el cambio
 */
export async function updateSolicitudEstatus(id, estatus, comentario, user) {
  const solicitudActual = await prisma.solicitud.findUnique({ where: { id } });

  if (!solicitudActual) {
    throw new Error('Solicitud no encontrada.');
  }

  // Mapa de transiciones permitidas para cada estatus
  const VALID_TRANSITIONS = {
    'REGISTRADA':  ['EN REVISIÓN', 'DICTAMINADA', 'FINALIZADA'],
    'EN REVISIÓN': ['REGISTRADA', 'DICTAMINADA', 'FINALIZADA'],
    'DICTAMINADA': ['EN REVISIÓN', 'APROBADA', 'FINALIZADA'],
    'APROBADA':    ['DICTAMINADA', 'PAGADA', 'FINALIZADA'],
    'PAGADA':      ['APROBADA', 'FINALIZADA'],
    'FINALIZADA':  [] // Estado terminal — no se puede cambiar
  };

  const currentStatus = solicitudActual.status;
  const allowed = VALID_TRANSITIONS[currentStatus] || [];

  // Verificar que la transición solicitada sea válida
  if (currentStatus !== estatus && !allowed.includes(estatus)) {
    throw new Error(
      `Transición de estatus no permitida: no se puede cambiar de "${currentStatus}" a "${estatus}".`
    );
  }

  // Para avanzar a estatus de dictamen o superiores, se requieren documentos completos
  // (excepto módulos de comunicación que no requieren documentos físicos)
  if (['DICTAMINADA', 'APROBADA', 'PAGADA', 'FINALIZADA'].includes(estatus)) {
    if (solicitudActual.moduloTipo !== 'MEDIOS' && solicitudActual.moduloTipo !== 'TEMAS_IMPORTANTES') {
      const documentosFaltantes = !solicitudActual.ineUrl || !solicitudActual.curpUrl ||
                                   !solicitudActual.rfcUrl || !solicitudActual.comprobanteUrl ||
                                   !solicitudActual.facturaUrl;
      if (documentosFaltantes) {
        throw new Error(
          'No se puede avanzar el estatus: faltan documentos obligatorios (INE, CURP, RFC, comprobante domicilio, factura).'
        );
      }
    }
  }

  // Ejecutar el cambio de estatus en una transacción para garantizar consistencia
  const result = await prisma.$transaction(async (tx) => {
    // Actualizar el estatus de la solicitud
    const solActualizada = await tx.solicitud.update({
      where: { id },
      data: { status: estatus }
    });

    // Sincronizar el estatus en el registro de ApoyoControl relacionado (si existe)
    if (solicitudActual.apoyoControlId) {
      await tx.apoyoControl.update({
        where: { id: solicitudActual.apoyoControlId },
        data: { estatus }
      });
    }

    // Insertar evento en el historial de estatus del expediente
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

  clearStatsCache();
  return result;
}

// ─── Actualización de Documentos ───────────────────────────────────────────────

/**
 * Actualiza las URLs de los documentos digitalizados de un expediente.
 * Se llama después de subir archivos con el endpoint /api/upload.
 *
 * @param {string} id - UUID del expediente
 * @param {Object} documents - Objeto con las URLs de los documentos
 */
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

// ─── Cache de Estadísticas ───────────────────────────────────────────────────
let statsCache = { data: null, timestamp: 0 };
const STATS_CACHE_TTL = 3 * 60 * 1000; // TTL: 3 minutos en milisegundos

/**
 * Invalida la caché del dashboard cuando se realizan cambios en solicitudes
 */
export function clearStatsCache() {
  statsCache = { data: null, timestamp: 0 };
}

// ─── Estadísticas del Dashboard ────────────────────────────────────────────────

/**
 * Genera las estadísticas agregadas para el dashboard principal.
 * Utiliza caché en memoria con TTL de 3 minutos para optimizar el rendimiento.
 *
 * @returns {Promise<Object>} Objeto con todas las estadísticas
 */
export async function getStatsDashboard() {
  const now = Date.now();
  if (statsCache.data && (now - statsCache.timestamp < STATS_CACHE_TTL)) {
    return statsCache.data;
  }

  // Total de expedientes registrados en el sistema
  const totalSolicitudes = await prisma.solicitud.count();

  // Suma total de inversión de todos los apoyos económicos
  const sumas = await prisma.apoyoControl.aggregate({
    _sum: { montoTotal: true }
  });

  // Suma de inversión solo en expedientes aprobados/pagados/finalizados
  const sumasAprobadas = await prisma.apoyoControl.aggregate({
    _sum: { montoTotal: true },
    where: { estatus: { in: ['APROBADA', 'PAGADA', 'FINALIZADA'] } }
  });

  // Conteos de beneficiarios por género (solo personas físicas)
  const beneficiariosHombres = await prisma.productor.count({
    where: { tipoPersona: 'FISICA', genero: 'Hombre' }
  });
  const beneficiariosMujeres = await prisma.productor.count({
    where: { tipoPersona: 'FISICA', genero: 'Mujer' }
  });
  // Conteo de organizaciones (personas morales y grupos)
  const organizaciones = await prisma.productor.count({
    where: { tipoPersona: { in: ['MORAL', 'GRUPO'] } }
  });

  // Distribución de expedientes por estatus (para gráfica de dona)
  const estatusGroup = await prisma.solicitud.groupBy({
    by: ['status'],
    _count: { id: true }
  });

  // Consulta SQL directa para obtener conteo e inversión por módulo productivo
  // (Prisma no soporta GROUP BY con JOIN en la API de alto nivel)
  const modulosGroup = await prisma.$queryRaw`
    SELECT s."moduloTipo" as modulo, COUNT(s.id)::int as count, COALESCE(SUM(a."montoTotal")::float, 0) as inversion
    FROM "Solicitud" s
    LEFT JOIN "ApoyoControl" a ON s."apoyoControlId" = a.id
    GROUP BY s."moduloTipo"
  `;

  // Obtener los presupuestos sectoriales asignados desde la tabla PresupuestoSector
  const presupuestosBd = await prisma.presupuestoSector.findMany();

  // Combinar datos de inversión real con presupuesto asignado por sector
  const modulosConPresupuesto = presupuestosBd.map(p => {
    const dbModulo = modulosGroup.find(m => m.modulo === p.sector);
    return {
      modulo: p.sector,
      count: dbModulo ? dbModulo.count : 0,
      inversion: dbModulo ? dbModulo.inversion : 0,
      presupuestoAsignado: Number(p.montoAsignado)
    };
  });

  // Agregar módulos que tienen expedientes pero no tienen presupuesto asignado (ej: MEDIOS)
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

  // Top municipios por inversión total
  const municipioInversiones = await prisma.$queryRaw`
    SELECT p.municipio, COUNT(s.id)::int as count, SUM(a."montoTotal")::float as inversion
    FROM "Solicitud" s
    JOIN "Productor" p ON s."productorId" = p.id
    JOIN "ApoyoControl" a ON s."apoyoControlId" = a.id
    GROUP BY p.municipio
    ORDER BY inversion DESC
  `;

  // Localidades dentro de cada municipio ordenadas por inversión
  const localidadInversiones = await prisma.$queryRaw`
    SELECT p.municipio, p.localidad, COUNT(s.id)::int as count, SUM(a."montoTotal")::float as inversion
    FROM "Solicitud" s
    JOIN "Productor" p ON s."productorId" = p.id
    JOIN "ApoyoControl" a ON s."apoyoControlId" = a.id
    WHERE p.localidad IS NOT NULL AND p.localidad <> ''
    GROUP BY p.municipio, p.localidad
    ORDER BY inversion DESC
  `;

  // Anidar localidades dentro de su municipio correspondiente
  const municipiosConLocalidades = municipioInversiones.map(m => ({
    ...m,
    localidades: localidadInversiones.filter(l => l.municipio === m.municipio)
  }));

  const result = {
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

  statsCache = { data: result, timestamp: Date.now() };
  return result;
}

// ─── Padrón de Productores ─────────────────────────────────────────────────────

/**
 * Devuelve la lista completa de productores registrados en el sistema
 * con sus solicitudes de apoyo asociadas.
 *
 * @returns {Promise<Productor[]>} Lista de productores con sus solicitudes
 */
export async function getProductoresList() {
  return prisma.productor.findMany({
    include: {
      solicitudes: {
        select: {
          id: true,
          folio: true,
          moduloTipo: true,
          status: true,
          fechaRegistro: true
        },
        orderBy: { fechaRegistro: 'desc' }
      }
    },
    orderBy: { createdAt: 'desc' }
  });
}

/**
 * Busca si un productor (ciudadano u organización) ya existe en la base de datos por CURP o RFC.
 *
 * @param {string} queryStr - CURP o RFC a consultar
 * @returns {Promise<Productor|null>} El productor encontrado o null
 */
export async function buscarProductorByCurpOrRfc(queryStr) {
  if (!queryStr || queryStr.trim().length < 3) return null;
  const q = queryStr.trim().toUpperCase();

  return prisma.productor.findFirst({
    where: {
      OR: [
        { curp: { equals: q, mode: 'insensitive' } },
        { rfc: { equals: q, mode: 'insensitive' } }
      ]
    },
    include: {
      solicitudes: {
        select: {
          id: true,
          folio: true,
          moduloTipo: true,
          status: true
        }
      }
    }
  });
}

/**
 * Tarea automática ejecutada al arrancar el servidor para consolidar y fusionar
 * cualquier registro de productor duplicado existente en la base de datos (PostgreSQL).
 */
export async function autoDeduplicateProductores() {
  try {
    const todos = await prisma.productor.findMany({
      include: { solicitudes: true },
      orderBy: { createdAt: 'desc' }
    });

    const grupos = {};
    todos.forEach(p => {
      const key = (p.curp?.trim() || p.rfc?.trim())?.toUpperCase();
      if (key && key.length >= 10) {
        if (!grupos[key]) grupos[key] = [];
        grupos[key].push(p);
      }
    });

    let mergedCount = 0;
    for (const [key, lista] of Object.entries(grupos)) {
      if (lista.length > 1) {
        const principal = lista[0];
        const duplicados = lista.slice(1);

        for (const dup of duplicados) {
          await prisma.solicitud.updateMany({
            where: { productorId: dup.id },
            data: { productorId: principal.id }
          });
          await prisma.productor.delete({ where: { id: dup.id } });
          mergedCount++;
        }
      }
    }

    if (mergedCount > 0) {
      console.log(`[AUTO-DEDUPLICATION] ✅ Se consolidaron ${mergedCount} registros duplicados en la base de datos.`);
    }
  } catch (err) {
    console.error('[AUTO-DEDUPLICATION] Error al ejecutar desduplicación automática:', err);
  }
}
