import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { authMiddleware } from '../../shared/middleware/auth.js';

const router = express.Router();

// Carpeta de almacenamiento local
const uploadDir = 'uploads';

// Asegurar que existe la carpeta
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Configuración del motor de almacenamiento de Multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, file.fieldname + '-' + uniqueSuffix + ext);
  }
});

// Filtros y límites del cargador
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // Máximo 5MB
  fileFilter: (req, file, cb) => {
    const filetypes = /jpeg|jpg|png|pdf/;
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = filetypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    }
    cb(new Error('Formato no permitido. Solo se aceptan PDFs e imágenes (JPG, PNG).'));
  }
});

// Endpoint POST /api/upload
router.post('/', authMiddleware, upload.single('file'), (req, res) => {
  if (!req.file) {
    res.status(400).json({ error: 'No se ha proporcionado ningún archivo.' });
    return;
  }

  // URL relativa de acceso estático
  const fileUrl = `/uploads/${req.file.filename}`;
  res.json({
    success: true,
    url: fileUrl,
    filename: req.file.filename,
    size: req.file.size
  });
});

// Manejador de errores para Multer
router.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      res.status(400).json({ error: 'El archivo supera el límite permitido de 5MB.' });
      return;
    }
    res.status(400).json({ error: `Error de subida: ${err.message}` });
    return;
  }
  res.status(400).json({ error: err.message || 'Error interno al procesar archivo.' });
});

export default router;
