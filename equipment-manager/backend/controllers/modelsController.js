// =====================================================
// MODELS CONTROLLER
// =====================================================

const db = require('../config/database');

/**
 * Obtener todos los modelos
 * GET /api/models
 */
const getAllModels = async (req, res) => {
  try {
    const result = await db.query(`
      SELECT m.id, m.brand_id, m.name, m.image_url, 
             m.reset_instructions, m.possible_passwords,
             m.created_at, m.updated_at,
             b.name as brand_name
      FROM models m
      INNER JOIN brands b ON m.brand_id = b.id
      ORDER BY b.name ASC, m.name ASC
    `);

    res.json({
      success: true,
      data: result.rows
    });

  } catch (error) {
    console.error('Error al obtener modelos:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener modelos.'
    });
  }
};

/**
 * Buscar modelos por nombre
 * GET /api/models/search?q=keyword
 */
const searchModels = async (req, res) => {
  try {
    const { q } = req.query;

    if (!q || q.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Parámetro de búsqueda requerido.'
      });
    }

    const searchTerm = `%${q.trim()}%`;

    const result = await db.query(`
      SELECT m.id, m.brand_id, m.name, m.image_url, 
             m.reset_instructions, m.possible_passwords,
             m.created_at, m.updated_at,
             b.name as brand_name
      FROM models m
      INNER JOIN brands b ON m.brand_id = b.id
      WHERE LOWER(m.name) LIKE LOWER($1) 
         OR LOWER(b.name) LIKE LOWER($1)
      ORDER BY b.name ASC, m.name ASC
    `, [searchTerm]);

    res.json({
      success: true,
      data: result.rows
    });

  } catch (error) {
    console.error('Error al buscar modelos:', error);
    res.status(500).json({
      success: false,
      message: 'Error al buscar modelos.'
    });
  }
};

/**
 * Obtener un modelo por ID
 * GET /api/models/:id
 */
const getModelById = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await db.query(`
      SELECT m.id, m.brand_id, m.name, m.image_url, 
             m.reset_instructions, m.possible_passwords,
             m.created_at, m.updated_at,
             b.name as brand_name
      FROM models m
      INNER JOIN brands b ON m.brand_id = b.id
      WHERE m.id = $1
    `, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Modelo no encontrado.'
      });
    }

    res.json({
      success: true,
      data: result.rows[0]
    });

  } catch (error) {
    console.error('Error al obtener modelo:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener modelo.'
    });
  }
};

/**
 * Crear un nuevo modelo (solo admin)
 * POST /api/models
 */
const createModel = async (req, res) => {
  try {
    const { brand_id, name, image_url, reset_instructions, possible_passwords } = req.body;

    // Validación
    if (!brand_id || !name) {
      return res.status(400).json({
        success: false,
        message: 'brand_id y name son requeridos.'
      });
    }

    // Verificar que la marca existe
    const brandCheck = await db.query(
      'SELECT id FROM brands WHERE id = $1',
      [brand_id]
    );

    if (brandCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Marca no encontrada.'
      });
    }

    // Verificar que el modelo no existe para esta marca
    const duplicateCheck = await db.query(
      'SELECT id FROM models WHERE brand_id = $1 AND LOWER(name) = LOWER($2)',
      [brand_id, name.trim()]
    );

    if (duplicateCheck.rows.length > 0) {
      return res.status(409).json({
        success: false,
        message: 'Ya existe un modelo con ese nombre para esta marca.'
      });
    }

    // Validar y parsear possible_passwords si es string
    let passwordsValue = possible_passwords;
    if (typeof possible_passwords === 'string') {
      try {
        passwordsValue = JSON.stringify(JSON.parse(possible_passwords));
      } catch (e) {
        passwordsValue = possible_passwords;
      }
    } else if (Array.isArray(possible_passwords)) {
      passwordsValue = JSON.stringify(possible_passwords);
    }

    // Crear modelo
    const result = await db.query(
      `INSERT INTO models (brand_id, name, image_url, reset_instructions, possible_passwords)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, brand_id, name, image_url, reset_instructions, possible_passwords, created_at`,
      [brand_id, name.trim(), image_url || null, reset_instructions || '', passwordsValue || '[]']
    );

    // Registrar actividad
    await db.query(
      'INSERT INTO activity_logs (user_id, action, details) VALUES ($1, $2, $3)',
      [req.user.id, 'CREATE_MODEL', `Creó modelo: ${name} (Brand ID: ${brand_id})`]
    );

    res.status(201).json({
      success: true,
      message: 'Modelo creado exitosamente',
      data: result.rows[0]
    });

  } catch (error) {
    console.error('Error al crear modelo:', error);
    res.status(500).json({
      success: false,
      message: 'Error al crear modelo.'
    });
  }
};

/**
 * Actualizar modelo (solo admin)
 * PUT /api/models/:id
 */
const updateModel = async (req, res) => {
  try {
    const { id } = req.params;
    const { brand_id, name, image_url, reset_instructions, possible_passwords } = req.body;

    // Verificar que el modelo existe
    const existingModel = await db.query(
      'SELECT id FROM models WHERE id = $1',
      [id]
    );

    if (existingModel.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Modelo no encontrado.'
      });
    }

    // Si se cambia la marca, verificar que existe
    if (brand_id !== undefined) {
      const brandCheck = await db.query(
        'SELECT id FROM brands WHERE id = $1',
        [brand_id]
      );

      if (brandCheck.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Marca no encontrada.'
        });
      }
    }

    // Construir query dinámica
    let query = 'UPDATE models SET updated_at = CURRENT_TIMESTAMP';
    const params = [];
    let paramIndex = 1;

    if (brand_id !== undefined) {
      query += `, brand_id = $${paramIndex}`;
      params.push(brand_id);
      paramIndex++;
    }

    if (name !== undefined && name.trim().length > 0) {
      // Verificar duplicados
      const duplicateCheck = await db.query(
        'SELECT id FROM models WHERE brand_id = $1 AND LOWER(name) = LOWER($2) AND id != $3',
        [brand_id || existingModel.rows[0].brand_id, name.trim(), id]
      );

      if (duplicateCheck.rows.length > 0) {
        return res.status(409).json({
          success: false,
          message: 'Ya existe otro modelo con ese nombre para esta marca.'
        });
      }

      query += `, name = $${paramIndex}`;
      params.push(name.trim());
      paramIndex++;
    }

    if (image_url !== undefined) {
      query += `, image_url = $${paramIndex}`;
      params.push(image_url || null);
      paramIndex++;
    }

    if (reset_instructions !== undefined) {
      query += `, reset_instructions = $${paramIndex}`;
      params.push(reset_instructions);
      paramIndex++;
    }

    if (possible_passwords !== undefined) {
      let passwordsValue = possible_passwords;
      if (typeof possible_passwords === 'string') {
        try {
          passwordsValue = JSON.stringify(JSON.parse(possible_passwords));
        } catch (e) {
          passwordsValue = possible_passwords;
        }
      } else if (Array.isArray(possible_passwords)) {
        passwordsValue = JSON.stringify(possible_passwords);
      }

      query += `, possible_passwords = $${paramIndex}`;
      params.push(passwordsValue);
      paramIndex++;
    }

    query += ` WHERE id = $${paramIndex} RETURNING *`;
    params.push(id);

    const result = await db.query(query, params);

    // Registrar actividad
    await db.query(
      'INSERT INTO activity_logs (user_id, action, details) VALUES ($1, $2, $3)',
      [req.user.id, 'UPDATE_MODEL', `Actualizó modelo ID: ${id}`]
    );

    res.json({
      success: true,
      message: 'Modelo actualizado exitosamente',
      data: result.rows[0]
    });

  } catch (error) {
    console.error('Error al actualizar modelo:', error);
    res.status(500).json({
      success: false,
      message: 'Error al actualizar modelo.'
    });
  }
};

/**
 * Eliminar modelo (solo admin)
 * DELETE /api/models/:id
 */
const deleteModel = async (req, res) => {
  try {
    const { id } = req.params;

    // Verificar que el modelo existe
    const existingModel = await db.query(
      'SELECT id, name FROM models WHERE id = $1',
      [id]
    );

    if (existingModel.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Modelo no encontrado.'
      });
    }

    const model = existingModel.rows[0];

    // Eliminar modelo
    await db.query('DELETE FROM models WHERE id = $1', [id]);

    // Registrar actividad
    await db.query(
      'INSERT INTO activity_logs (user_id, action, details) VALUES ($1, $2, $3)',
      [req.user.id, 'DELETE_MODEL', `Eliminó modelo: ${model.name}`]
    );

    res.json({
      success: true,
      message: 'Modelo eliminado exitosamente'
    });

  } catch (error) {
    console.error('Error al eliminar modelo:', error);
    res.status(500).json({
      success: false,
      message: 'Error al eliminar modelo.'
    });
  }
};

module.exports = {
  getAllModels,
  searchModels,
  getModelById,
  createModel,
  updateModel,
  deleteModel
};
