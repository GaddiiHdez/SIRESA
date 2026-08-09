-- ============================================================
-- SIRESA — Esquema DDL de Base de Datos PostgreSQL
-- Secretaría de Desarrollo Rural del Estado de Nayarit
-- ============================================================
-- Este archivo contiene todas las sentencias DDL para crear las
-- tablas, llaves primarias, llaves foráneas e índices necesarios.
--
-- Uso con psql:
--   psql -U postgres -d desarrollo_rural_nayarit -f schema.sql
-- ============================================================

-- Habilitar extensión uuid-ossp si es necesario
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ─── Tabla: User (Usuarios y Roles RBAC) ──────────────────────────────────
CREATE TABLE IF NOT EXISTS "User" (
    "id" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'FUNCIONARIO',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- ─── Tabla: Productor (Datos del Beneficiario/Solicitante) ──────────────────
CREATE TABLE IF NOT EXISTS "Productor" (
    "id" TEXT NOT NULL,
    "nombre" TEXT,
    "apellidoPaterno" TEXT,
    "apellidoMaterno" TEXT,
    "rfc" TEXT,
    "curp" TEXT,
    "tipoPersona" TEXT NOT NULL,
    "nombreOrganizacion" TEXT,
    "representante" TEXT,
    "genero" TEXT,
    "indigena" TEXT NOT NULL,
    "etnia" TEXT,
    "discapacidad" TEXT NOT NULL,
    "tipoDiscapacidad" TEXT,
    "beneficiariosHombres" INTEGER,
    "beneficiariosMujeres" INTEGER,
    "tipoIdentificacion" TEXT,
    "folioIdentificacion" TEXT,
    "domicilio" TEXT NOT NULL,
    "telefono" TEXT,
    "municipio" TEXT NOT NULL,
    "localidad" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Productor_pkey" PRIMARY KEY ("id")
);

-- ─── Tabla: ApoyoControl (Control Financiero y Económico) ───────────────────
CREATE TABLE IF NOT EXISTS "ApoyoControl" (
    "id" TEXT NOT NULL,
    "gradoMarginacion" TEXT NOT NULL,
    "superficie" DECIMAL(12,2),
    "tenenciaTierra" TEXT,
    "conceptoApoyo" TEXT NOT NULL,
    "unidadMedida" TEXT NOT NULL,
    "cantidad" DECIMAL(12,2) NOT NULL,
    "especificacionApoyo" TEXT,
    "montoTotal" DECIMAL(12,2) NOT NULL,
    "aportacionPrograma" DECIMAL(12,2) NOT NULL,
    "aportacionSolicitante" DECIMAL(12,2) NOT NULL,
    "aportacionEstatal" DECIMAL(12,2) NOT NULL,
    "aportacionFederal" DECIMAL(12,2) NOT NULL,
    "estatus" TEXT NOT NULL,
    "priorizacion" TEXT NOT NULL,
    "dictamen" TEXT NOT NULL,
    "comentarioDictamen" TEXT,
    "sesionOd" TEXT,
    "fechaSesionOd" TIMESTAMP(3),
    "factura" TEXT,
    "proveedor" TEXT,
    "rfcProveedor" TEXT,
    "montoPagado" DECIMAL(12,2),
    "economia" DECIMAL(12,2),
    "fechaPago" TIMESTAMP(3),
    "trimestre" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ApoyoControl_pkey" PRIMARY KEY ("id")
);

-- ─── Tabla: Solicitud (Expediente Principal) ───────────────────────────────
CREATE TABLE IF NOT EXISTS "Solicitud" (
    "id" TEXT NOT NULL,
    "folio" TEXT NOT NULL,
    "fechaRegistro" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fechaSolicitud" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "programa" TEXT NOT NULL,
    "componente" TEXT NOT NULL,
    "moduloTipo" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'REGISTRADA',
    "productorId" TEXT,
    "apoyoControlId" TEXT,
    "ineUrl" TEXT,
    "curpUrl" TEXT,
    "rfcUrl" TEXT,
    "comprobanteUrl" TEXT,
    "facturaUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Solicitud_pkey" PRIMARY KEY ("id")
);

-- ─── Tablas Específicas por Módulo Productivo ──────────────────────────────

CREATE TABLE IF NOT EXISTS "DatosGanaderia" (
    "id" TEXT NOT NULL,
    "solicitudId" TEXT NOT NULL,
    "nombrePredio" TEXT NOT NULL,
    "municipio" TEXT NOT NULL,
    "localidad" TEXT NOT NULL,
    "upp" TEXT NOT NULL,
    "latitudN" TEXT NOT NULL,
    "longitudW" TEXT NOT NULL,
    "credencialGanadera" TEXT,
    "inventarioGanadero" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DatosGanaderia_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "DatosAgriculturaFrijol" (
    "id" TEXT NOT NULL,
    "solicitudId" TEXT NOT NULL,
    "municipioActa" TEXT NOT NULL,
    "localidadActa" TEXT,
    "fechaActa" TIMESTAMP(3),
    "conceptoApoyo" TEXT,
    "nombreProveedor" TEXT,
    "representanteEmpresa" TEXT,
    "nombreSupervisorGubernamental" TEXT,
    "variedadSemillaCertificada" TEXT NOT NULL,
    "cantidadAutorizadaKg" DECIMAL(12,2) NOT NULL,
    "superficieAutorizadaHa" DECIMAL(12,2) NOT NULL,
    "numeroBultos" INTEGER,
    "tituloPropiedad" TEXT,
    "enCasoOtroEspecificar" TEXT,
    "numeroDocumento" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DatosAgriculturaFrijol_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "DatosPescaAcuacultura" (
    "id" TEXT NOT NULL,
    "solicitudId" TEXT NOT NULL,
    "domicilioUnidadProductiva" TEXT NOT NULL,
    "municipio" TEXT NOT NULL,
    "localidad" TEXT NOT NULL,
    "concesionAgua" TEXT,
    "fechaPagoCria" TIMESTAMP(3),
    "permisoPesca" TEXT,
    "actaConstitutiva" TEXT,
    "fechaActaConstitutiva" TIMESTAMP(3),
    "rnpa" TEXT,
    "manifestacionImpactoAmbiental" TEXT,
    "resolucionProfepa" TEXT,
    "legalPossesion" TEXT,
    "facturaBienSustituir" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DatosPescaAcuacultura_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "DatosInfraestructura" (
    "id" TEXT NOT NULL,
    "solicitudId" TEXT NOT NULL,
    "domicilioUnidadDistritoRiego" TEXT NOT NULL,
    "municipio" TEXT NOT NULL,
    "localidad" TEXT NOT NULL,
    "concesionAgua" TEXT,
    "actaConstitutiva" TEXT,
    "fechaActaConstitutiva" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DatosInfraestructura_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "DatosMaquinaria" (
    "id" TEXT NOT NULL,
    "solicitudId" TEXT NOT NULL,
    "tractor" TEXT,
    "rastra" TEXT,
    "sc" TEXT,
    "sp" TEXT,
    "rf" TEXT,
    "rg" TEXT,
    "en" TEXT,
    "em" TEXT,
    "cribadora" TEXT,
    "b" TEXT,
    "mf" TEXT,
    "cg" TEXT,
    "niv" TEXT,
    "pps" TEXT,
    "otro" TEXT,
    "fechaSolicitada" TIMESTAMP(3),
    "ramaProductiva" TEXT,
    "plazoSolicitado" TEXT,
    "fecha1" TEXT,
    "fecha2" TEXT,
    "nombreContacto" TEXT,
    "telefonoContacto" TEXT,
    "transporte" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DatosMaquinaria_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "DatosMedios" (
    "id" TEXT NOT NULL,
    "solicitudId" TEXT NOT NULL,
    "subsecretaria" TEXT NOT NULL,
    "direccionDepartamento" TEXT,
    "tipoReporte" TEXT NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL,
    "lugar" TEXT,
    "municipio" TEXT,
    "localidad" TEXT,
    "asuntoTema" TEXT NOT NULL,
    "quienesIntervienen" TEXT,
    "reporteResumen" TEXT NOT NULL,
    "archivosMaterial" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DatosMedios_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "DatosTemasImportantes" (
    "id" TEXT NOT NULL,
    "solicitudId" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "descripcion" TEXT NOT NULL,
    "areaSeder" TEXT,
    "quienesIntervienen" TEXT,
    "comoSeAtiende" TEXT NOT NULL,
    "inversion" TEXT,
    "distribucion" TEXT,
    "productoresApoyados" TEXT,
    "hectareasApoyadas" TEXT,
    "beneficioAhorro" TEXT,
    "municipiosApoyados" TEXT,
    "reporteResumen" TEXT NOT NULL,
    "archivosMaterial" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DatosTemasImportantes_pkey" PRIMARY KEY ("id")
);

-- ─── Tabla: HistorialEstatus (Auditoría de Cambios de Estado) ───────────────
CREATE TABLE IF NOT EXISTS "HistorialEstatus" (
    "id" TEXT NOT NULL,
    "solicitudId" TEXT NOT NULL,
    "estatus" TEXT NOT NULL,
    "comentario" TEXT,
    "funcionario" TEXT NOT NULL,
    "fechaChange" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HistorialEstatus_pkey" PRIMARY KEY ("id")
);

-- ─── Tabla: PresupuestoSector (Configuración Presupuestal) ─────────────────
CREATE TABLE IF NOT EXISTS "PresupuestoSector" (
    "id" TEXT NOT NULL,
    "sector" TEXT NOT NULL,
    "montoAsignado" DECIMAL(12,2) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PresupuestoSector_pkey" PRIMARY KEY ("id")
);

-- ─── Índices Únicos ────────────────────────────────────────────────────────
CREATE UNIQUE INDEX IF NOT EXISTS "User_username_key" ON "User"("username");
CREATE UNIQUE INDEX IF NOT EXISTS "Solicitud_folio_key" ON "Solicitud"("folio");
CREATE UNIQUE INDEX IF NOT EXISTS "Solicitud_productorId_key" ON "Solicitud"("productorId");
CREATE UNIQUE INDEX IF NOT EXISTS "Solicitud_apoyoControlId_key" ON "Solicitud"("apoyoControlId");
CREATE UNIQUE INDEX IF NOT EXISTS "DatosGanaderia_solicitudId_key" ON "DatosGanaderia"("solicitudId");
CREATE UNIQUE INDEX IF NOT EXISTS "DatosAgriculturaFrijol_solicitudId_key" ON "DatosAgriculturaFrijol"("solicitudId");
CREATE UNIQUE INDEX IF NOT EXISTS "DatosPescaAcuacultura_solicitudId_key" ON "DatosPescaAcuacultura"("solicitudId");
CREATE UNIQUE INDEX IF NOT EXISTS "DatosInfraestructura_solicitudId_key" ON "DatosInfraestructura"("solicitudId");
CREATE UNIQUE INDEX IF NOT EXISTS "DatosMaquinaria_solicitudId_key" ON "DatosMaquinaria"("solicitudId");
CREATE UNIQUE INDEX IF NOT EXISTS "DatosMedios_solicitudId_key" ON "DatosMedios"("solicitudId");
CREATE UNIQUE INDEX IF NOT EXISTS "DatosTemasImportantes_solicitudId_key" ON "DatosTemasImportantes"("solicitudId");
CREATE UNIQUE INDEX IF NOT EXISTS "PresupuestoSector_sector_key" ON "PresupuestoSector"("sector");

-- ─── Índices de Rendimiento para Consultas y Filtros Frecuentes ────────────
CREATE INDEX IF NOT EXISTS "Solicitud_status_idx" ON "Solicitud"("status");
CREATE INDEX IF NOT EXISTS "Solicitud_programa_idx" ON "Solicitud"("programa");
CREATE INDEX IF NOT EXISTS "Solicitud_moduloTipo_idx" ON "Solicitud"("moduloTipo");
CREATE INDEX IF NOT EXISTS "Solicitud_fechaRegistro_idx" ON "Solicitud"("fechaRegistro");
CREATE INDEX IF NOT EXISTS "Productor_curp_idx" ON "Productor"("curp");
CREATE INDEX IF NOT EXISTS "Productor_municipio_idx" ON "Productor"("municipio");
CREATE INDEX IF NOT EXISTS "HistorialEstatus_solicitudId_idx" ON "HistorialEstatus"("solicitudId");

-- ─── Llaves Foráneas y Restricciones de Integridad ──────────────────────────
ALTER TABLE "Solicitud" ADD CONSTRAINT "Solicitud_productorId_fkey" FOREIGN KEY ("productorId") REFERENCES "Productor"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Solicitud" ADD CONSTRAINT "Solicitud_apoyoControlId_fkey" FOREIGN KEY ("apoyoControlId") REFERENCES "ApoyoControl"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "DatosGanaderia" ADD CONSTRAINT "DatosGanaderia_solicitudId_fkey" FOREIGN KEY ("solicitudId") REFERENCES "Solicitud"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "DatosAgriculturaFrijol" ADD CONSTRAINT "DatosAgriculturaFrijol_solicitudId_fkey" FOREIGN KEY ("solicitudId") REFERENCES "Solicitud"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "DatosPescaAcuacultura" ADD CONSTRAINT "DatosPescaAcuacultura_solicitudId_fkey" FOREIGN KEY ("solicitudId") REFERENCES "Solicitud"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "DatosInfraestructura" ADD CONSTRAINT "DatosInfraestructura_solicitudId_fkey" FOREIGN KEY ("solicitudId") REFERENCES "Solicitud"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "DatosMaquinaria" ADD CONSTRAINT "DatosMaquinaria_solicitudId_fkey" FOREIGN KEY ("solicitudId") REFERENCES "Solicitud"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "DatosMedios" ADD CONSTRAINT "DatosMedios_solicitudId_fkey" FOREIGN KEY ("solicitudId") REFERENCES "Solicitud"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "DatosTemasImportantes" ADD CONSTRAINT "DatosTemasImportantes_solicitudId_fkey" FOREIGN KEY ("solicitudId") REFERENCES "Solicitud"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "HistorialEstatus" ADD CONSTRAINT "HistorialEstatus_solicitudId_fkey" FOREIGN KEY ("solicitudId") REFERENCES "Solicitud"("id") ON DELETE CASCADE ON UPDATE CASCADE;
