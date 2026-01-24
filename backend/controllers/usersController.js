// =====================================================
// USERS CONTROLLER
// =====================================================

const bcrypt = require('bcrypt');
const db = require('../config/database');

/**
 * Obtener todos los usuarios (solo admin)
 * GET /api/users
 */
const getAllUsers = async (req, res) => {
  try {
    const result = await db.query(`
      SELECT id, username, role, active, created_at, updated_at
      FROM users
      ORDER BY created_at DESC
    `);

    res.json({
      success: true,
      data: result.rows
    });

  } catch (error) {
    console.error('Error al obtener usuarios:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener usuarios.'
    });
  }
};

/**
 * Obtener un usuario por ID
 * GET /api/users/:id
 */
const getUserById = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await db.query(
      'SELECT id, username, role, active, created_at, updated_at FROM users WHERE id = $1',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado.'
      });
    }

    res.json({
      success: true,
      data: result.rows[0]
    });

  } catch (error) {
    console.error('Error al obtener usuario:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener usuario.'
    });
  }
};

/**
 * Crear un nuevo usuario (solo admin)
 * POST /api/users
 */
const createUser = async (req, res) => {
  try {
    const { username, password, role } = req.body;

    // Validación
    if (!username || !password || !role) {
      return res.status(400).json({
        success: false,
        message: 'Todos los campos son requeridos.'
      });
    }

    if (!['admin', 'user'].includes(role)) {
      return res.status(400).json({
        success: false,
        message: 'Rol inválido. Use "admin" o "user".'
      });
    }

    // Validar longitud de contraseña
    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'La contraseña debe tener al menos 6 caracteres.'
      });
    }

    // Verificar si el usuario ya existe
    const existingUser = await db.query(
      'SELECT id FROM users WHERE username = $1',
      [username]
    );

    if (existingUser.rows.length > 0) {
      return res.status(409).json({
        success: false,
        message: 'El nombre de usuario ya existe.'
      });
    }

    // Si es admin, verificar que no exista otro admin
    if (role === 'admin') {
      const existingAdmin = await db.query(
        'SELECT id FROM users WHERE role = $1',
        ['admin']
      );

      if (existingAdmin.rows.length > 0) {
        return res.status(409).json({
          success: false,
          message: 'Ya existe un administrador en el sistema.'
        });
      }
    }

    // Hash de la contraseña
    const saltRounds = 10;
    const password_hash = await bcrypt.hash(password, saltRounds);

    // Crear usuario
    const result = await db.query(
      `INSERT INTO users (username, password_hash, role, active)
       VALUES ($1, $2, $3, $4)
       RETURNING id, username, role, active, created_at`,
      [username, password_hash, role, true]
    );

    // Registrar actividad
    await db.query(
      'INSERT INTO activity_logs (user_id, action, details) VALUES ($1, $2, $3)',
      [req.user.id, 'CREATE_USER', `Creó usuario: ${username} (${role})`]
    );

    res.status(201).json({
      success: true,
      message: 'Usuario creado exitosamente',
      data: result.rows[0]
    });

  } catch (error) {
    console.error('Error al crear usuario:', error);
    res.status(500).json({
      success: false,
      message: 'Error al crear usuario.'
    });
  }
};

/**
 * Actualizar usuario (solo admin)
 * PUT /api/users/:id
 */
const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { username, password, role, active } = req.body;

    // Verificar que el usuario existe
    const existingUser = await db.query(
      'SELECT id, role FROM users WHERE id = $1',
      [id]
    );

    if (existingUser.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado.'
      });
    }

    // Construir query dinámica
    let query = 'UPDATE users SET updated_at = CURRENT_TIMESTAMP';
    const params = [];
    let paramIndex = 1;

    if (username !== undefined) {
      // Verificar que el username no esté en uso
      const duplicateCheck = await db.query(
        'SELECT id FROM users WHERE username = $1 AND id != $2',
        [username, id]
      );

      if (duplicateCheck.rows.length > 0) {
        return res.status(409).json({
          success: false,
          message: 'El nombre de usuario ya existe.'
        });
      }

      query += `, username = $${paramIndex}`;
      params.push(username);
      paramIndex++;
    }

    if (password !== undefined && password.length > 0) {
      if (password.length < 6) {
        return res.status(400).json({
          success: false,
          message: 'La contraseña debe tener al menos 6 caracteres.'
        });
      }

      const saltRounds = 10;
      const password_hash = await bcrypt.hash(password, saltRounds);
      query += `, password_hash = $${paramIndex}`;
      params.push(password_hash);
      paramIndex++;
    }

    if (role !== undefined) {
      if (!['admin', 'user'].includes(role)) {
        return res.status(400).json({
          success: false,
          message: 'Rol inválido.'
        });
      }

      // Si cambia a admin, verificar que no haya otro
      if (role === 'admin' && existingUser.rows[0].role !== 'admin') {
        const existingAdmin = await db.query(
          'SELECT id FROM users WHERE role = $1 AND id != $2',
          ['admin', id]
        );

        if (existingAdmin.rows.length > 0) {
          return res.status(409).json({
            success: false,
            message: 'Ya existe un administrador en el sistema.'
          });
        }
      }

      query += `, role = $${paramIndex}`;
      params.push(role);
      paramIndex++;
    }

    if (active !== undefined) {
      query += `, active = $${paramIndex}`;
      params.push(active);
      paramIndex++;
    }

    query += ` WHERE id = $${paramIndex} RETURNING id, username, role, active, updated_at`;
    params.push(id);

    const result = await db.query(query, params);

    // Registrar actividad
    await db.query(
      'INSERT INTO activity_logs (user_id, action, details) VALUES ($1, $2, $3)',
      [req.user.id, 'UPDATE_USER', `Actualizó usuario ID: ${id}`]
    );

    res.json({
      success: true,
      message: 'Usuario actualizado exitosamente',
      data: result.rows[0]
    });

  } catch (error) {
    console.error('Error al actualizar usuario:', error);
    res.status(500).json({
      success: false,
      message: 'Error al actualizar usuario.'
    });
  }
};

/**
 * Eliminar usuario (solo admin)
 * DELETE /api/users/:id
 */
const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    // Verificar que no se elimine a sí mismo
    if (parseInt(id) === req.user.id) {
      return res.status(400).json({
        success: false,
        message: 'No puedes eliminar tu propia cuenta.'
      });
    }

    // Verificar que el usuario existe
    const existingUser = await db.query(
      'SELECT id, username, role FROM users WHERE id = $1',
      [id]
    );

    if (existingUser.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado.'
      });
    }

    const user = existingUser.rows[0];

    // Eliminar usuario
    await db.query('DELETE FROM users WHERE id = $1', [id]);

    // Registrar actividad
    await db.query(
      'INSERT INTO activity_logs (user_id, action, details) VALUES ($1, $2, $3)',
      [req.user.id, 'DELETE_USER', `Eliminó usuario: ${user.username} (${user.role})`]
    );

    res.json({
      success: true,
      message: 'Usuario eliminado exitosamente'
    });

  } catch (error) {
    console.error('Error al eliminar usuario:', error);
    res.status(500).json({
      success: false,
      message: 'Error al eliminar usuario.'
    });
  }
};

module.exports = {
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser
};
