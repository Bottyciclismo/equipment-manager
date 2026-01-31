// =====================================================
// BRANDS CONTROLLER
// =====================================================

const db = require('../config/database');

/**
 * Obtener todas las marcas
 * GET /api/brands
 */
const getAllBrands = async (req, res) => {
  try {
    const result = await db.query(`
      SELECT id, name, created_at, updated_at
      FROM brands
      ORDER BY name ASC
    `);

    res.json({
      success: true,
      data: result.rows
    });

  } catch (error) {
    console.error('Error al obtener marcas:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener marcas.'
    });
  }
};

/**
 * Obtener una marca por ID
 * GET /api/brands/:id
 */
const getBrandById = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await db.query(
      'SELECT id, name, created_at, updated_at FROM brands WHERE id = $1',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Marca no encontrada.'
      });
    }

    res.json({
      success: true,
      data: result.rows[0]
    });

  } catch (error) {
    console.error('Error al obtener marca:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener marca.'
    });
  }
};

/**
 * Crear una nueva marca (solo admin)
 * POST /api/brands
 */
const createBrand = async (req, res) => {
  try {
    const { name } = req.body;

    // Validación
    if (!name || name.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'El nombre de la marca es requerido.'
      });
    }

    // Verificar si la marca ya existe
    const existingBrand = await db.query(
      'SELECT id FROM brands WHERE LOWER(name) = LOWER($1)',
      [name.trim()]
    );

    if (existingBrand.rows.length > 0) {
      return res.status(409).json({
        success: false,
        message: 'La marca ya existe.'
      });
    }

    // Crear marca
    const result = await db.query(
      `INSERT INTO brands (name)
       VALUES ($1)
       RETURNING id, name, created_at`,
      [name.trim()]
    );

    // Registrar actividad
    await db.query(
      'INSERT INTO activity_logs (user_id, action, details) VALUES ($1, $2, $3)',
      [req.user.id, 'CREATE_BRAND', `Creó marca: ${name}`]
    );

    res.status(201).json({
      success: true,
      message: 'Marca creada exitosamente',
      data: result.rows[0]
    });

  } catch (error) {
    console.error('Error al crear marca:', error);
    res.status(500).json({
      success: false,
      message: 'Error al crear marca.'
    });
  }
};

/**
 * Actualizar marca (solo admin)
 * PUT /api/brands/:id
 */
const updateBrand = async (req, res) => {
  try {
    const { id } = req.params;
    const { name } = req.body;

    // Validación
    if (!name || name.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'El nombre de la marca es requerido.'
      });
    }

    // Verificar que la marca existe
    const existingBrand = await db.query(
      'SELECT id FROM brands WHERE id = $1',
      [id]
    );

    if (existingBrand.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Marca no encontrada.'
      });
    }

    // Verificar que el nuevo nombre no esté en uso
    const duplicateCheck = await db.query(
      'SELECT id FROM brands WHERE LOWER(name) = LOWER($1) AND id != $2',
      [name.trim(), id]
    );

    if (duplicateCheck.rows.length > 0) {
      return res.status(409).json({
        success: false,
        message: 'Ya existe otra marca con ese nombre.'
      });
    }

    // Actualizar marca
    const result = await db.query(
      `UPDATE brands
       SET name = $1, updated_at = CURRENT_TIMESTAMP
       WHERE id = $2
       RETURNING id, name, updated_at`,
      [name.trim(), id]
    );

    // Registrar actividad
    await db.query(
      'INSERT INTO activity_logs (user_id, action, details) VALUES ($1, $2, $3)',
      [req.user.id, 'UPDATE_BRAND', `Actualizó marca ID: ${id} a "${name}"`]
    );

    res.json({
      success: true,
      message: 'Marca actualizada exitosamente',
      data: result.rows[0]
    });

  } catch (error) {
    console.error('Error al actualizar marca:', error);
    res.status(500).json({
      success: false,
      message: 'Error al actualizar marca.'
    });
  }
};

/**
 * Eliminar marca (solo admin)
 * DELETE /api/brands/:id
 * Nota: Esto también eliminará todos los modelos asociados (CASCADE)
 */
const deleteBrand = async (req, res) => {
  try {
    const { id } = req.params;

    // Verificar que la marca existe
    const existingBrand = await db.query(
      'SELECT id, name FROM brands WHERE id = $1',
      [id]
    );

    if (existingBrand.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Marca no encontrada.'
      });
    }

    const brand = existingBrand.rows[0];

    // Verificar cuántos modelos serán eliminados
    const modelsCount = await db.query(
      'SELECT COUNT(*) as count FROM models WHERE brand_id = $1',
      [id]
    );

    // Eliminar marca (y modelos por CASCADE)
    await db.query('DELETE FROM brands WHERE id = $1', [id]);

    // Registrar actividad
    await db.query(
      'INSERT INTO activity_logs (user_id, action, details) VALUES ($1, $2, $3)',
      [
        req.user.id,
        'DELETE_BRAND',
        `Eliminó marca: ${brand.name} (${modelsCount.rows[0].count} modelos eliminados)`
      ]
    );

    res.json({
      success: true,
      message: `Marca eliminada exitosamente. ${modelsCount.rows[0].count} modelo(s) también fueron eliminados.`
    });

  } catch (error) {
    console.error('Error al eliminar marca:', error);
    res.status(500).json({
      success: false,
      message: 'Error al eliminar marca.'
    });
  }
};

/**
 * Obtener modelos de una marca
 * GET /api/brands/:id/models
 */
const getBrandModels = async (req, res) => {
  try {
    const { id } = req.params;

    // Verificar que la marca existe
    const brandCheck = await db.query(
      'SELECT id FROM brands WHERE id = $1',
      [id]
    );

    if (brandCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Marca no encontrada.'
      });
    }

    // Obtener modelos
    const result = await db.query(
      `SELECT id, brand_id, name, image_url, reset_instructions, 
              possible_passwords, created_at, updated_at
       FROM models
       WHERE brand_id = $1
       ORDER BY name ASC`,
      [id]
    );

    res.json({
      success: true,
      data: result.rows
    });

  } catch (error) {
    console.error('Error al obtener modelos de marca:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener modelos.'
    });
  }
};

module.exports = {
  getAllBrands,
  getBrandById,
  createBrand,
  updateBrand,
  deleteBrand,
  getBrandModels
};
