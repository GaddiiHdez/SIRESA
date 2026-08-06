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
 * Restricciones:
 *  - Solo archivos PDF, JPG y PNG son aceptados
 *  - Tamaño máximo: 5MB por archivo
 *  - Requiere token de autenticación válido
 *
 * Almacenamiento:
 *  - Los archivos se guardan en la carpeta /uploads del servidor
 *  - En producción (Railway), los archivos son efímeros (se pierden al reiniciar)
 *    → Se recomienda migrar a almacenamiento en la nube (S3, Cloudinary, etc.)
 *
 * Endpoint:
 *  POST /api/upload → retorna { success, url, filename, size }
 *  La URL devuelta puede guardarse directamente en los campos *Url de la solicitud
 */

import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { authMiddleware } from '../../shared/middleware/auth.js';

const router = express.Router();

// ─── Configuración de la Carpeta de Destino ────────────────────────────────────
const uploadDir = 'uploads';

// Crear la carpeta si no existe (se ejecuta al arrancar el servidor)
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// ─── Motor de Almacenamiento de Multer ────────────────────────────────────────
// diskStorage guarda los archivos en disco (vs. memoryStorage que los guarda en RAM)
const storage = multer.diskStorage({
  // Carpeta destino donde se guardan los archivos
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },

  // Nombre único del archivo para evitar colisiones.
  // Formato: <fieldname>-<timestamp>-<random>.<extension>
  // Ej: file-1785350069834-709170748.pdf
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, file.fieldname + '-' + uniqueSuffix + ext);
  }
});

// ─── Filtros y Límites de Multer ───────────────────────────────────────────────
const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // Límite de 5MB (5 × 1024 × 1024 bytes)
  },
  fileFilter: (req, file, cb) => {
    // Lista blanca de tipos MIME y extensiones permitidos
    const allowedTypes = /jpeg|jpg|png|pdf/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true); // Archivo aceptado
    }

    // Rechazar tipos de archivo no permitidos
    cb(new Error('Formato no permitido. Solo se aceptan PDFs e imágenes (JPG, PNG).'));
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

    // Construir la URL pública relativa del archivo guardado
    // El servidor sirve /uploads/* como archivos estáticos en server.js
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
// Este manejador de 4 parámetros captura los errores lanzados por Multer
// (límite de tamaño, tipo de archivo inválido, etc.)
router.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    // Error específico de Multer (ej: archivo demasiado grande)
    if (err.code === 'LIMIT_FILE_SIZE') {
      res.status(400).json({ error: 'El archivo supera el límite permitido de 5MB.' });
      return;
    }
    res.status(400).json({ error: `Error de subida: ${err.message}` });
    return;
  }
  // Error del fileFilter (tipo de archivo no permitido) u otro error
  res.status(400).json({ error: err.message || 'Error interno al procesar el archivo.' });
});

export default router;
