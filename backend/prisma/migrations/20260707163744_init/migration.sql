-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'FUNCIONARIO',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Solicitud" (
    "id" TEXT NOT NULL,
    "folio" TEXT NOT NULL,
    "fechaRegistro" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fechaSolicitud" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "programa" TEXT NOT NULL,
    "componente" TEXT NOT NULL,
    "moduloTipo" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'REGISTRADA',
    "productorId" TEXT NOT NULL,
    "apoyoControlId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Solicitud_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Productor" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "apellidoPaterno" TEXT NOT NULL,
    "apellidoMaterno" TEXT NOT NULL,
    "rfc" TEXT NOT NULL,
    "curp" TEXT NOT NULL,
    "tipoPersona" TEXT NOT NULL,
    "nombreOrganizacion" TEXT,
    "representante" TEXT,
    "genero" TEXT NOT NULL,
    "indigena" TEXT NOT NULL,
    "etnia" TEXT,
    "discapacidad" TEXT NOT NULL,
    "tipoDiscapacidad" TEXT,
    "beneficiariosHombres" INTEGER,
    "beneficiariosMujeres" INTEGER,
    "tipoIdentificacion" TEXT NOT NULL,
    "folioIdentificacion" TEXT NOT NULL,
    "domicilio" TEXT NOT NULL,
    "telefono" TEXT NOT NULL,
    "municipio" TEXT NOT NULL,
    "localidad" TEXT NOT NULL,

    CONSTRAINT "Productor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ApoyoControl" (
    "id" TEXT NOT NULL,
    "gradoMarginacion" TEXT NOT NULL,
    "superficie" DECIMAL(65,30),
    "tenenciaTierra" TEXT NOT NULL,
    "conceptoApoyo" TEXT NOT NULL,
    "unidadMedida" TEXT NOT NULL,
    "cantidad" DECIMAL(65,30) NOT NULL,
    "especificacionApoyo" TEXT,
    "montoTotal" DECIMAL(65,30) NOT NULL,
    "aportacionPrograma" DECIMAL(65,30) NOT NULL,
    "aportacionSolicitante" DECIMAL(65,30) NOT NULL,
    "aportacionEstatal" DECIMAL(65,30) NOT NULL,
    "aportacionFederal" DECIMAL(65,30) NOT NULL,
    "estatus" TEXT NOT NULL,
    "priorizacion" TEXT NOT NULL,
    "dictamen" TEXT NOT NULL,
    "comentarioDictamen" TEXT,
    "sesionOd" TEXT,
    "fechaSesionOd" TIMESTAMP(3),
    "factura" TEXT,
    "proveedor" TEXT,
    "rfcProveedor" TEXT,
    "montoPagado" DECIMAL(65,30),
    "economia" DECIMAL(65,30),
    "fechaPago" TIMESTAMP(3),
    "trimestre" TEXT NOT NULL,

    CONSTRAINT "ApoyoControl_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DatosGanaderia" (
    "id" TEXT NOT NULL,
    "solicitudId" TEXT NOT NULL,
    "nombrePredio" TEXT NOT NULL,
    "municipio" TEXT NOT NULL,
    "localidad" TEXT NOT NULL,
    "upp" TEXT NOT NULL,
    "latitudN" TEXT NOT NULL,
    "longitudW" TEXT NOT NULL,
    "credencialGanadera" TEXT NOT NULL,
    "inventarioGanadero" TEXT NOT NULL,

    CONSTRAINT "DatosGanaderia_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DatosAgriculturaFrijol" (
    "id" TEXT NOT NULL,
    "solicitudId" TEXT NOT NULL,
    "municipioActa" TEXT NOT NULL,
    "localidadActa" TEXT NOT NULL,
    "fechaActa" TIMESTAMP(3) NOT NULL,
    "conceptoApoyo" TEXT NOT NULL,
    "nombreProveedor" TEXT NOT NULL,
    "representanteEmpresa" TEXT NOT NULL,
    "nombreSupervisorGubernamental" TEXT NOT NULL,
    "variedadSemillaCertificada" TEXT NOT NULL,
    "cantidadAutorizadaKg" DECIMAL(65,30) NOT NULL,
    "superficieAutorizadaHa" DECIMAL(65,30) NOT NULL,
    "numeroBultos" INTEGER NOT NULL,
    "tituloPropiedad" TEXT NOT NULL,
    "enCasoOtroEspecificar" TEXT,
    "numeroDocumento" TEXT NOT NULL,

    CONSTRAINT "DatosAgriculturaFrijol_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DatosPescaAcuacultura" (
    "id" TEXT NOT NULL,
    "solicitudId" TEXT NOT NULL,
    "domicilioUnidadProductiva" TEXT NOT NULL,
    "municipio" TEXT NOT NULL,
    "localidad" TEXT NOT NULL,
    "concesionAgua" TEXT NOT NULL,
    "fechaPagoCria" TIMESTAMP(3) NOT NULL,
    "permisoPesca" TEXT NOT NULL,
    "actaConstitutiva" TEXT NOT NULL,
    "fechaActaConstitutiva" TIMESTAMP(3) NOT NULL,
    "rnpa" TEXT NOT NULL,
    "manifestacionImpactoAmbiental" TEXT NOT NULL,
    "resolucionProfepa" TEXT NOT NULL,
    "legalPossesion" TEXT NOT NULL,
    "facturaBienSustituir" TEXT NOT NULL,

    CONSTRAINT "DatosPescaAcuacultura_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DatosInfraestructura" (
    "id" TEXT NOT NULL,
    "solicitudId" TEXT NOT NULL,
    "domicilioUnidadDistritoRiego" TEXT NOT NULL,
    "municipio" TEXT NOT NULL,
    "localidad" TEXT NOT NULL,
    "concesionAgua" TEXT NOT NULL,
    "actaConstitutiva" TEXT NOT NULL,
    "fechaActaConstitutiva" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DatosInfraestructura_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DatosMaquinaria" (
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
    "fechaSolicitada" TIMESTAMP(3) NOT NULL,
    "ramaProductiva" TEXT NOT NULL,
    "plazoSolicitado" TEXT NOT NULL,
    "fecha1" TEXT,
    "fecha2" TEXT,
    "nombreContacto" TEXT NOT NULL,
    "telefonoContacto" TEXT NOT NULL,
    "transporte" TEXT,

    CONSTRAINT "DatosMaquinaria_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DatosMedios" (
    "id" TEXT NOT NULL,
    "solicitudId" TEXT NOT NULL,
    "subsecretaria" TEXT NOT NULL,
    "direccionDepartamento" TEXT NOT NULL,
    "tipoReporte" TEXT NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL,
    "lugar" TEXT NOT NULL,
    "municipio" TEXT NOT NULL,
    "localidad" TEXT NOT NULL,
    "asuntoTema" TEXT NOT NULL,
    "quienesIntervienen" TEXT NOT NULL,
    "reporteResumen" TEXT NOT NULL,
    "archivosMaterial" TEXT,

    CONSTRAINT "DatosMedios_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DatosTemasImportantes" (
    "id" TEXT NOT NULL,
    "solicitudId" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "descripcion" TEXT NOT NULL,
    "areaSeder" TEXT NOT NULL,
    "quienesIntervienen" TEXT NOT NULL,
    "comoSeAtiende" TEXT NOT NULL,
    "inversion" TEXT,
    "distribucion" TEXT,
    "productoresApoyados" TEXT,
    "hectareasApoyadas" TEXT,
    "beneficioAhorro" TEXT,
    "municipiosApoyados" TEXT,
    "reporteResumen" TEXT NOT NULL,
    "archivosMaterial" TEXT,

    CONSTRAINT "DatosTemasImportantes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HistorialEstatus" (
    "id" TEXT NOT NULL,
    "solicitudId" TEXT NOT NULL,
    "estatus" TEXT NOT NULL,
    "comentario" TEXT,
    "funcionario" TEXT NOT NULL,
    "fechaChange" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "HistorialEstatus_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");

-- CreateIndex
CREATE UNIQUE INDEX "Solicitud_folio_key" ON "Solicitud"("folio");

-- CreateIndex
CREATE UNIQUE INDEX "Solicitud_productorId_key" ON "Solicitud"("productorId");

-- CreateIndex
CREATE UNIQUE INDEX "Solicitud_apoyoControlId_key" ON "Solicitud"("apoyoControlId");

-- CreateIndex
CREATE UNIQUE INDEX "DatosGanaderia_solicitudId_key" ON "DatosGanaderia"("solicitudId");

-- CreateIndex
CREATE UNIQUE INDEX "DatosAgriculturaFrijol_solicitudId_key" ON "DatosAgriculturaFrijol"("solicitudId");

-- CreateIndex
CREATE UNIQUE INDEX "DatosPescaAcuacultura_solicitudId_key" ON "DatosPescaAcuacultura"("solicitudId");

-- CreateIndex
CREATE UNIQUE INDEX "DatosInfraestructura_solicitudId_key" ON "DatosInfraestructura"("solicitudId");

-- CreateIndex
CREATE UNIQUE INDEX "DatosMaquinaria_solicitudId_key" ON "DatosMaquinaria"("solicitudId");

-- CreateIndex
CREATE UNIQUE INDEX "DatosMedios_solicitudId_key" ON "DatosMedios"("solicitudId");

-- CreateIndex
CREATE UNIQUE INDEX "DatosTemasImportantes_solicitudId_key" ON "DatosTemasImportantes"("solicitudId");

-- AddForeignKey
ALTER TABLE "Solicitud" ADD CONSTRAINT "Solicitud_productorId_fkey" FOREIGN KEY ("productorId") REFERENCES "Productor"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Solicitud" ADD CONSTRAINT "Solicitud_apoyoControlId_fkey" FOREIGN KEY ("apoyoControlId") REFERENCES "ApoyoControl"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DatosGanaderia" ADD CONSTRAINT "DatosGanaderia_solicitudId_fkey" FOREIGN KEY ("solicitudId") REFERENCES "Solicitud"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DatosAgriculturaFrijol" ADD CONSTRAINT "DatosAgriculturaFrijol_solicitudId_fkey" FOREIGN KEY ("solicitudId") REFERENCES "Solicitud"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DatosPescaAcuacultura" ADD CONSTRAINT "DatosPescaAcuacultura_solicitudId_fkey" FOREIGN KEY ("solicitudId") REFERENCES "Solicitud"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DatosInfraestructura" ADD CONSTRAINT "DatosInfraestructura_solicitudId_fkey" FOREIGN KEY ("solicitudId") REFERENCES "Solicitud"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DatosMaquinaria" ADD CONSTRAINT "DatosMaquinaria_solicitudId_fkey" FOREIGN KEY ("solicitudId") REFERENCES "Solicitud"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DatosMedios" ADD CONSTRAINT "DatosMedios_solicitudId_fkey" FOREIGN KEY ("solicitudId") REFERENCES "Solicitud"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DatosTemasImportantes" ADD CONSTRAINT "DatosTemasImportantes_solicitudId_fkey" FOREIGN KEY ("solicitudId") REFERENCES "Solicitud"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HistorialEstatus" ADD CONSTRAINT "HistorialEstatus_solicitudId_fkey" FOREIGN KEY ("solicitudId") REFERENCES "Solicitud"("id") ON DELETE CASCADE ON UPDATE CASCADE;
