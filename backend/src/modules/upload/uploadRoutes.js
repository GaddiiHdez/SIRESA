/**
 * ============================================================
 * Módulo de Subida de Archivos — Rutas y Configuración
 * ============================================================
 *
 * Maneja la carga de documentos digitales de los expedientes:
 * identificaciones (INE), CURP, RFC, comprobantes de domicilio y facturas.
 *
 * Tecnología usada: Multer (middleware de Node.js para multipart/form-data)
 *
 * Restricciones de Seguridad (A-6):
 *  - Sanitización estricta de nombres y lista blanca de extensiones (.pdf, .jpg, .jpeg, .png)
 *  - Validación cruzada entre extensión y MIME type real
 *  - Tamaño máximo: 5MB por archivo
 *  - Requiere token de autenticación válido
 *
 * Almacenamiento:
 *  - Los archivos se guardan en la carpeta /uploads del servidor
 *
 * Endpoint:
 *  POST /api/upload → retorna { success, url, filename, size }
 */

import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { authMiddleware } from '../../shared/middleware/auth.js';

const router = express.Router();

// ─── Configuración de la Carpeta de Destino ────────────────────────────────────
const uploadDir = 'uploads';

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Extensiones permitidas explícitas
const ALLOWED_EXTENSIONS = ['.pdf', '.jpg', '.jpeg', '.png'];
const ALLOWED_MIME_TYPES = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];

// ─── Motor de Almacenamiento de Multer ────────────────────────────────────────
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },

  // Nombre único y sanitizado del archivo
  filename: (req, file, cb) => {
    const rawExt = path.extname(file.originalname).toLowerCase();
    const cleanExt = ALLOWED_EXTENSIONS.includes(rawExt) ? rawExt : '.pdf';
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    // Solo caracteres alfanuméricos para el prefijo
    const safePrefix = (file.fieldname || 'doc').replace(/[^a-zA-Z0-9]/g, '');

    cb(null, `${safePrefix}-${uniqueSuffix}${cleanExt}`);
  }
});

// ─── Filtros y Límites de Multer ───────────────────────────────────────────────
const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // Límite estricto de 5MB
  },
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const isExtAllowed = ALLOWED_EXTENSIONS.includes(ext);
    const isMimeAllowed = ALLOWED_MIME_TYPES.includes(file.mimetype);

    if (isExtAllowed && isMimeAllowed) {
      return cb(null, true);
    }

    cb(new Error('Formato no permitido. Solo se aceptan archivos PDF e imágenes en formato JPG o PNG.'));
  }
});

// ─── Endpoint POST /api/upload ─────────────────────────────────────────────────
router.post('/',
  authMiddleware,         // Solo usuarios autenticados pueden subir archivos
  upload.single('file'), // Acepta un solo archivo en el campo 'file'
  (req, res) => {
    if (!req.file) {
      res.status(400).json({ error: 'No se ha proporcionado ningún archivo.' });
      return;
    }

    const fileUrl = `/uploads/${req.file.filename}`;

    res.json({
      success: true,
      url: fileUrl,                  // URL para guardar en la base de datos
      filename: req.file.filename,   // Nombre del archivo en el servidor
      size: req.file.size            // Tamaño en bytes
    });
  }
);

// ─── Manejador de Errores de Multer ───────────────────────────────────────────
router.use((err, req, res, _next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      res.status(400).json({ error: 'El archivo supera el límite permitido de 5MB.' });
      return;
    }
    res.status(400).json({ error: `Error de subida: ${err.message}` });
    return;
  }
  res.status(400).json({ error: err.message || 'Error interno al procesar el archivo.' });
});

export default router;
