-- =============================================================================
-- ESQUEMA OFICIAL DE BASE DE DATOS POSTGRESQL - SIRESA NAYARIT
-- Secretaría de Desarrollo Rural del Estado de Nayarit (Ciclo Fiscal 2026)
-- =============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. TABLA: User (Usuarios y Servidores Públicos)
CREATE TABLE IF NOT EXISTS "User" (
    "id" TEXT NOT NULL DEFAULT uuid_generate_v4(),
    "username" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'FUNCIONARIO',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "User_username_key" ON "User"("username");

-- 2. TABLA: Productor (Padrón de Beneficiarios Físicos, Morales y Grupos)
CREATE TABLE IF NOT EXISTS "Productor" (
    "id" TEXT NOT NULL DEFAULT uuid_generate_v4(),
    "nombre" TEXT,
    "apellidoPaterno" TEXT,
    "apellidoMaterno" TEXT,
    "rfc" TEXT,
    "curp" TEXT,
    "tipoPersona" TEXT NOT NULL,
    "nombreOrganizacion" TEXT,
    "representante" TEXT,
    "genero" TEXT,
    "indigena" TEXT NOT NULL DEFAULT 'NO',
    "etnia" TEXT,
    "discapacidad" TEXT NOT NULL DEFAULT 'NO',
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
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Productor_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "Productor_curp_idx" ON "Productor"("curp");
CREATE INDEX IF NOT EXISTS "Productor_municipio_idx" ON "Productor"("municipio");

-- 3. TABLA: ApoyoControl (Control Presupuestal y Dictaminación de la Solicitud)
CREATE TABLE IF NOT EXISTS "ApoyoControl" (
    "id" TEXT NOT NULL DEFAULT uuid_generate_v4(),
    "gradoMarginacion" TEXT NOT NULL,
    "superficie" DECIMAL(12,2),
    "tenenciaTierra" TEXT NOT NULL,
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
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ApoyoControl_pkey" PRIMARY KEY ("id")
);

-- 4. TABLA PRINCIPAL: Solicitud (Expediente Institucional)
CREATE TABLE IF NOT EXISTS "Solicitud" (
    "id" TEXT NOT NULL DEFAULT uuid_generate_v4(),
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
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Solicitud_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "Solicitud_productorId_fkey" FOREIGN KEY ("productorId") REFERENCES "Productor"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Solicitud_apoyoControlId_fkey" FOREIGN KEY ("apoyoControlId") REFERENCES "ApoyoControl"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS "Solicitud_folio_key" ON "Solicitud"("folio");
CREATE UNIQUE INDEX IF NOT EXISTS "Solicitud_productorId_key" ON "Solicitud"("productorId");
CREATE UNIQUE INDEX IF NOT EXISTS "Solicitud_apoyoControlId_key" ON "Solicitud"("apoyoControlId");
CREATE INDEX IF NOT EXISTS "Solicitud_status_idx" ON "Solicitud"("status");
CREATE INDEX IF NOT EXISTS "Solicitud_programa_idx" ON "Solicitud"("programa");
CREATE INDEX IF NOT EXISTS "Solicitud_fechaRegistro_idx" ON "Solicitud"("fechaRegistro");

-- 5. TABLA TÉCNICA: DatosGanaderia (Módulo Ganadería)
CREATE TABLE IF NOT EXISTS "DatosGanaderia" (
    "id" TEXT NOT NULL DEFAULT uuid_generate_v4(),
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
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DatosGanaderia_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "DatosGanaderia_solicitudId_fkey" FOREIGN KEY ("solicitudId") REFERENCES "Solicitud"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE UNIQUE INDEX IF NOT EXISTS "DatosGanaderia_solicitudId_key" ON "DatosGanaderia"("solicitudId");

-- 6. TABLA TÉCNICA: DatosAgriculturaFrijol (Módulo Agricultura / Frijol)
CREATE TABLE IF NOT EXISTS "DatosAgriculturaFrijol" (
    "id" TEXT NOT NULL DEFAULT uuid_generate_v4(),
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
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DatosAgriculturaFrijol_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "DatosAgriculturaFrijol_solicitudId_fkey" FOREIGN KEY ("solicitudId") REFERENCES "Solicitud"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE UNIQUE INDEX IF NOT EXISTS "DatosAgriculturaFrijol_solicitudId_key" ON "DatosAgriculturaFrijol"("solicitudId");

-- 7. TABLA TÉCNICA: DatosPescaAcuacultura (Módulo Pesca y Acuacultura)
CREATE TABLE IF NOT EXISTS "DatosPescaAcuacultura" (
    "id" TEXT NOT NULL DEFAULT uuid_generate_v4(),
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
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DatosPescaAcuacultura_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "DatosPescaAcuacultura_solicitudId_fkey" FOREIGN KEY ("solicitudId") REFERENCES "Solicitud"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE UNIQUE INDEX IF NOT EXISTS "DatosPescaAcuacultura_solicitudId_key" ON "DatosPescaAcuacultura"("solicitudId");

-- 8. TABLA TÉCNICA: DatosInfraestructura (Módulo Infraestructura Rural)
CREATE TABLE IF NOT EXISTS "DatosInfraestructura" (
    "id" TEXT NOT NULL DEFAULT uuid_generate_v4(),
    "solicitudId" TEXT NOT NULL,
    "domicilioUnidadDistritoRiego" TEXT NOT NULL,
    "municipio" TEXT NOT NULL,
    "localidad" TEXT NOT NULL,
    "concesionAgua" TEXT,
    "actaConstitutiva" TEXT,
    "fechaActaConstitutiva" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DatosInfraestructura_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "DatosInfraestructura_solicitudId_fkey" FOREIGN KEY ("solicitudId") REFERENCES "Solicitud"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE UNIQUE INDEX IF NOT EXISTS "DatosInfraestructura_solicitudId_key" ON "DatosInfraestructura"("solicitudId");

-- 9. TABLA TÉCNICA: DatosMaquinaria (Módulo Maquinaria)
CREATE TABLE IF NOT EXISTS "DatosMaquinaria" (
    "id" TEXT NOT NULL DEFAULT uuid_generate_v4(),
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
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DatosMaquinaria_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "DatosMaquinaria_solicitudId_fkey" FOREIGN KEY ("solicitudId") REFERENCES "Solicitud"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE UNIQUE INDEX IF NOT EXISTS "DatosMaquinaria_solicitudId_key" ON "DatosMaquinaria"("solicitudId");

-- 10. TABLA TÉCNICA: DatosMedios (Módulo Información para Medios)
CREATE TABLE IF NOT EXISTS "DatosMedios" (
    "id" TEXT NOT NULL DEFAULT uuid_generate_v4(),
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
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DatosMedios_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "DatosMedios_solicitudId_fkey" FOREIGN KEY ("solicitudId") REFERENCES "Solicitud"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE UNIQUE INDEX IF NOT EXISTS "DatosMedios_solicitudId_key" ON "DatosMedios"("solicitudId");

-- 11. TABLA TÉCNICA: DatosTemasImportantes (Módulo Temas Importantes)
CREATE TABLE IF NOT EXISTS "DatosTemasImportantes" (
    "id" TEXT NOT NULL DEFAULT uuid_generate_v4(),
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
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DatosTemasImportantes_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "DatosTemasImportantes_solicitudId_fkey" FOREIGN KEY ("solicitudId") REFERENCES "Solicitud"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE UNIQUE INDEX IF NOT EXISTS "DatosTemasImportantes_solicitudId_key" ON "DatosTemasImportantes"("solicitudId");

-- 12. TABLA: HistorialEstatus (Bitácora de Trazabilidad)
CREATE TABLE IF NOT EXISTS "HistorialEstatus" (
    "id" TEXT NOT NULL DEFAULT uuid_generate_v4(),
    "solicitudId" TEXT NOT NULL,
    "estatus" TEXT NOT NULL,
    "comentario" TEXT,
    "funcionario" TEXT NOT NULL,
    "fechaChange" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "HistorialEstatus_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "HistorialEstatus_solicitudId_fkey" FOREIGN KEY ("solicitudId") REFERENCES "Solicitud"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX IF NOT EXISTS "HistorialEstatus_solicitudId_idx" ON "HistorialEstatus"("solicitudId");

-- 13. TABLA: PresupuestoSector (Techos Presupuestales por Sector)
CREATE TABLE IF NOT EXISTS "PresupuestoSector" (
    "id" TEXT NOT NULL DEFAULT uuid_generate_v4(),
    "sector" TEXT NOT NULL,
    "montoAsignado" DECIMAL(12,2) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PresupuestoSector_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "PresupuestoSector_sector_key" ON "PresupuestoSector"("sector");

-- =============================================================================
-- INSERCIÓN DE DATOS INICIALES (SEED DATA)
-- =============================================================================

-- Usuario Administrador por defecto (Contraseña: admin123)
INSERT INTO "User" ("id", "username", "passwordHash", "name", "role")
VALUES (
    uuid_generate_v4(),
    'admin',
    '$2b$10$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeg6Lruj3vjPGga31lW',
    'Administrador SEDER',
    'ADMINISTRADOR'
) ON CONFLICT ("username") DO NOTHING;

-- Usuario Funcionario por defecto (Contraseña: admin123)
INSERT INTO "User" ("id", "username", "passwordHash", "name", "role")
VALUES (
    uuid_generate_v4(),
    'funcionario',
    '$2b$10$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeg6Lruj3vjPGga31lW',
    'Ventanilla de Registro',
    'FUNCIONARIO'
) ON CONFLICT ("username") DO NOTHING;

-- Techos Presupuestales Iniciales 2026
INSERT INTO "PresupuestoSector" ("id", "sector", "montoAsignado")
VALUES
    (uuid_generate_v4(), 'AGRICULTURA_FRIJOL', 2500000.00),
    (uuid_generate_v4(), 'GANADERIA', 3000000.00),
    (uuid_generate_v4(), 'PESCA_ACUACULTURA', 2000000.00),
    (uuid_generate_v4(), 'MAQUINARIA', 4000000.00),
    (uuid_generate_v4(), 'INFRAESTRUCTURA', 5000000.00)
ON CONFLICT ("sector") DO NOTHING;
