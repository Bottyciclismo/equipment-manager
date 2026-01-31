// =====================================================
// UPLOAD CONTROLLER
// =====================================================

const path = require('path');
const fs = require('fs');
const db = require('../config/database');

/**
 * Subir imagen
 * POST /api/upload
 */
const uploadImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No se ha proporcionado ningún archivo.'
      });
    }

    // URL relativa del archivo
    const fileUrl = `/uploads/${req.file.filename}`;

    // Registrar actividad
    await db.query(
      'INSERT INTO activity_logs (user_id, action, details) VALUES ($1, $2, $3)',
      [req.user.id, 'UPLOAD_IMAGE', `Subió imagen: ${req.file.filename}`]
    );

    res.json({
      success: true,
      message: 'Imagen subida exitosamente',
      data: {
        filename: req.file.filename,
        originalName: req.file.originalname,
        size: req.file.size,
        mimetype: req.file.mimetype,
        url: fileUrl
      }
    });

  } catch (error) {
    console.error('Error al subir imagen:', error);
    res.status(500).json({
      success: false,
      message: 'Error al subir imagen.'
    });
  }
};

/**
 * Eliminar imagen
 * DELETE /api/upload/:filename
 */
const deleteImage = async (req, res) => {
  try {
    const { filename } = req.params;

    // Validar que el filename no contenga caracteres peligrosos
    if (filename.includes('..') || filename.includes('/')) {
      return res.status(400).json({
        success: false,
        message: 'Nombre de archivo inválido.'
      });
    }

    const filePath = path.join('./uploads', filename);

    // Verificar si el archivo existe
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({
        success: false,
        message: 'Archivo no encontrado.'
      });
    }

    // Verificar si la imagen está siendo usada por algún modelo
    const modelsUsing = await db.query(
      'SELECT id, name FROM models WHERE image_url = $1',
      [`/uploads/${filename}`]
    );

    if (modelsUsing.rows.length > 0) {
      return res.status(409).json({
        success: false,
        message: 'La imagen está siendo utilizada por uno o más modelos.',
        data: {
          models: modelsUsing.rows
        }
      });
    }

    // Eliminar archivo
    fs.unlinkSync(filePath);

    // Registrar actividad
    await db.query(
      'INSERT INTO activity_logs (user_id, action, details) VALUES ($1, $2, $3)',
      [req.user.id, 'DELETE_IMAGE', `Eliminó imagen: ${filename}`]
    );

    res.json({
      success: true,
      message: 'Imagen eliminada exitosamente'
    });

  } catch (error) {
    console.error('Error al eliminar imagen:', error);
    res.status(500).json({
      success: false,
      message: 'Error al eliminar imagen.'
    });
  }
};

/**
 * Listar todas las imágenes
 * GET /api/upload
 */
const listImages = async (req, res) => {
  try {
    const uploadDir = './uploads';

    // Crear directorio si no existe
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    const files = fs.readdirSync(uploadDir);

    const images = files
      .filter(file => {
        const ext = path.extname(file).toLowerCase();
        return ['.jpg', '.jpeg', '.png', '.gif', '.webp'].includes(ext);
      })
      .map(file => {
        const stats = fs.statSync(path.join(uploadDir, file));
        return {
          filename: file,
          url: `/uploads/${file}`,
          size: stats.size,
          created: stats.birthtime
        };
      })
      .sort((a, b) => b.created - a.created);

    res.json({
      success: true,
      data: images
    });

  } catch (error) {
    console.error('Error al listar imágenes:', error);
    res.status(500).json({
      success: false,
      message: 'Error al listar imágenes.'
    });
  }
};

module.exports = {
  uploadImage,
  deleteImage,
  listImages
};
