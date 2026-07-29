import { z } from 'zod';

/**
 * Schemas de validación Zod para el módulo de solicitudes.
 */

// Estatus válidos del sistema
const ESTATUS_VALIDOS = [
  'REGISTRADA', 'EN REVISIÓN', 'DICTAMINADA', 'APROBADA', 'PAGADA', 'FINALIZADA'
];

// Módulos válidos del sistema
const MODULOS_VALIDOS = [
  'GANADERIA', 'AGRICULTURA_FRIJOL', 'PESCA_ACUACULTURA',
  'INFRAESTRUCTURA', 'MAQUINARIA', 'MEDIOS', 'TEMAS_IMPORTANTES'
];

// Tipos de persona válidos
const TIPOS_PERSONA = ['FISICA', 'MORAL', 'GRUPO'];

// ─── Schema para crear solicitud ────────────────────────────

const productorSchema = z.object({
  tipoPersona: z.enum(TIPOS_PERSONA, { errorMap: () => ({ message: 'Tipo de persona inválido. Debe ser FISICA, MORAL o GRUPO.' }) }),
  nombre: z.string().max(100).optional().nullable(),
  apellidoPaterno: z.string().max(100).optional().nullable(),
  apellidoMaterno: z.string().max(100).optional().nullable(),
  nombreOrganizacion: z.string().max(200).optional().nullable(),
  representante: z.string().max(200).optional().nullable(),
  rfc: z.string().max(13).optional().nullable(),
  curp: z.string().max(18).optional().nullable(),
  genero: z.string().max(50).optional().nullable(),
  indigena: z.string().max(5).default('NO'),
  etnia: z.string().max(100).optional().nullable(),
  discapacidad: z.string().max(5).default('NO'),
  tipoDiscapacidad: z.string().max(100).optional().nullable(),
  beneficiariosHombres: z.union([z.string(), z.number()]).optional().nullable(),
  beneficiariosMujeres: z.union([z.string(), z.number()]).optional().nullable(),
  tipoIdentificacion: z.string().max(100).optional().nullable(),
  folioIdentificacion: z.string().max(50).optional().nullable(),
  domicilio: z.string().min(1, 'El domicilio es requerido.').max(500),
  telefono: z.string().max(20).optional().nullable(),
  municipio: z.string().min(1, 'El municipio es requerido.').max(100),
  localidad: z.string().min(1, 'La localidad es requerida.').max(200)
});

const apoyoControlSchema = z.object({
  gradoMarginacion: z.string().max(50).default('Medio'),
  superficie: z.union([z.string(), z.number()]).optional().nullable(),
  tenenciaTierra: z.string().max(50).optional().nullable(),
  conceptoApoyo: z.string().min(1, 'El concepto de apoyo es requerido.').max(500),
  unidadMedida: z.string().min(1, 'La unidad de medida es requerida.').max(50),
  cantidad: z.union([z.string(), z.number()]).default('0'),
  especificacionApoyo: z.string().max(500).optional().nullable(),
  montoTotal: z.union([z.string(), z.number()]).default('0'),
  aportacionPrograma: z.union([z.string(), z.number()]).default('0'),
  aportacionSolicitante: z.union([z.string(), z.number()]).default('0'),
  aportacionEstatal: z.union([z.string(), z.number()]).default('0'),
  aportacionFederal: z.union([z.string(), z.number()]).default('0'),
  priorizacion: z.string().max(50).default('Media'),
  dictamen: z.string().max(50).default('Sin Dictamen'),
  comentarioDictamen: z.string().max(1000).optional().nullable(),
  sesionOd: z.string().max(100).optional().nullable(),
  fechaSesionOd: z.string().optional().nullable(),
  factura: z.string().max(100).optional().nullable(),
  proveedor: z.string().max(200).optional().nullable(),
  rfcProveedor: z.string().max(13).optional().nullable(),
  montoPagado: z.union([z.string(), z.number()]).optional().nullable(),
  economia: z.union([z.string(), z.number()]).optional().nullable(),
  fechaPago: z.string().optional().nullable(),
  trimestre: z.string().max(50).default('Primer')
}).passthrough();

export const crearSolicitudSchema = z.object({
  fechaRegistro: z.string().optional().nullable(),
  fechaSolicitud: z.string().optional().nullable(),
  programa: z.string().min(1, 'El programa es requerido.').max(200),
  componente: z.string().min(1, 'El componente es requerido.').max(200),
  moduloTipo: z.enum(MODULOS_VALIDOS, {
    errorMap: () => ({ message: `Módulo inválido. Debe ser uno de: ${MODULOS_VALIDOS.join(', ')}` })
  }),
  productor: productorSchema.optional().nullable(),
  apoyoControl: apoyoControlSchema.optional().nullable(),
  datosEspecif: z.record(z.any()).optional().nullable(),
  
  // URLs de documentos cargados
  ineUrl: z.string().max(500).optional().nullable(),
  curpUrl: z.string().max(500).optional().nullable(),
  rfcUrl: z.string().max(500).optional().nullable(),
  comprobanteUrl: z.string().max(500).optional().nullable(),
  facturaUrl: z.string().max(500).optional().nullable()
}).superRefine((data, ctx) => {
  const { moduloTipo, productor, apoyoControl } = data;

  // 1. Validar Productor (Obligatorio en todo menos Reportes Informativos)
  if (moduloTipo !== 'MEDIOS' && moduloTipo !== 'TEMAS_IMPORTANTES') {
    if (!productor) {
      ctx.addIssue({
        path: ['productor'],
        code: z.ZodIssueCode.custom,
        message: 'El productor es obligatorio para este tipo de solicitud.'
      });
    }
  }

  // 2. Validar Apoyo Financiero (Obligatorio en Subsidios y Obras Colectivas)
  const requiereFinanciero = ['GANADERIA', 'AGRICULTURA_FRIJOL', 'PESCA_ACUACULTURA'];
  if (requiereFinanciero.includes(moduloTipo)) {
    if (!apoyoControl) {
      ctx.addIssue({
        path: ['apoyoControl'],
        code: z.ZodIssueCode.custom,
        message: 'Los datos financieros de apoyo y control son obligatorios para este tipo de solicitud.'
      });
    }
  }
});

// ─── Schema para actualizar estatus ─────────────────────────

export const actualizarEstatusSchema = z.object({
  estatus: z.enum(ESTATUS_VALIDOS, {
    errorMap: () => ({ message: `Estatus inválido. Debe ser uno de: ${ESTATUS_VALIDOS.join(', ')}` })
  }),
  comentario: z.string().max(1000).optional().nullable()
});

// ─── Schema para validar params con UUID ────────────────────

export const idParamSchema = z.object({
  id: z.string().uuid('El ID proporcionado no es un UUID válido.')
});

// ─── Schema para query de listado ───────────────────────────

export const listarQuerySchema = z.object({
  folio: z.string().max(50).optional(),
  status: z.string().max(200).optional(),
  programa: z.string().max(200).optional(),
  curp: z.string().max(18).optional(),
  municipio: z.string().max(100).optional(),
  moduloTipo: z.string().max(100).optional(),
  genero: z.string().optional(),
  tipoPersona: z.string().optional(),
  fechaInicio: z.string().optional(),
  fechaFin: z.string().optional(),
  page: z.preprocess((val) => val === undefined ? 1 : Number(val), z.number().int().min(1).default(1)),
  limit: z.preprocess((val) => val === undefined ? 10 : Number(val), z.number().int().min(1).max(100).default(10))
}).passthrough();

export const actualizarDocumentosSchema = z.object({
  ineUrl: z.string().max(500).optional().nullable(),
  curpUrl: z.string().max(500).optional().nullable(),
  rfcUrl: z.string().max(500).optional().nullable(),
  comprobanteUrl: z.string().max(500).optional().nullable(),
  facturaUrl: z.string().max(500).optional().nullable()
});
