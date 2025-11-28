// middlewares/uploadMiddleware.js
import multer from 'multer';
import path from 'path';
import fs from 'fs';

// Asegurarse de que existe el directorio de uploads
const uploadDir = 'uploads/actividades';
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Configuración de almacenamiento
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // Generar nombre único para el archivo
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    const name = path.basename(file.originalname, ext);
    cb(null, name + '-' + uniqueSuffix + ext);
  }
});

// Filtro de archivos
const fileFilter = (req, file, cb) => {
  const allowedTypes = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain',
    'application/zip',
    'application/x-rar-compressed',
    'image/jpeg',
    'image/png',
    'image/gif',
    'video/mp4',
    'audio/mpeg'
  ];

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`Tipo de archivo no permitido: ${file.mimetype}. Tipos permitidos: PDF, Word, imágenes, archivos comprimidos, audio y video.`), false);
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB límite
  }
});

// Middleware para manejar errores de multer
const handleUploadErrors = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ 
        error: 'El archivo es demasiado grande. Tamaño máximo: 50MB' 
      });
    }
    if (err.code === 'LIMIT_UNEXPECTED_FILE') {
      return res.status(400).json({ 
        error: 'Tipo de archivo no permitido' 
      });
    }
  } else if (err) {
    return res.status(400).json({ error: err.message });
  }
  next();
};

// Middleware para limpiar archivos temporales
const cleanupTempFiles = (req, res, next) => {
  const originalSend = res.send;
  res.send = function(data) {
    // Limpiar archivos temporales después de la respuesta
    if (req.file && fs.existsSync(req.file.path)) {
      try {
        fs.unlinkSync(req.file.path);
        console.log('🧹 Archivo temporal eliminado:', req.file.path);
      } catch (error) {
        console.error('Error eliminando archivo temporal:', error);
      }
    }
    originalSend.call(this, data);
  };
  next();
};

export { upload, cleanupTempFiles, handleUploadErrors };