// =====================================================
// AUTHENTICATION CONTROLLER
// =====================================================

const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('../config/database');
require('dotenv').config();

/**
 * Login de usuario
 * POST /api/auth/login
 */
const login = async (req, res) => {
  try {
    const { username, password } = req.body;

    // Validación de campos
    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: 'Usuario y contraseña son requeridos.'
      });
    }

    // Buscar usuario
    const result = await db.query(
      'SELECT id, username, password_hash, role, active FROM users WHERE username = $1',
      [username]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'Credenciales inválidas.'
      });
    }

    const user = result.rows[0];

    // Verificar si el usuario está activo
    if (!user.active) {
      return res.status(403).json({
        success: false,
        message: 'Usuario desactivado. Contacte al administrador.'
      });
    }

    // Verificar contraseña
    const validPassword = await bcrypt.compare(password, user.password_hash);
    if (!validPassword) {
      return res.status(401).json({
        success: false,
        message: 'Credenciales inválidas.'
      });
    }

    // Generar token JWT
    const token = jwt.sign(
      {
        id: user.id,
        username: user.username,
        role: user.role,
        active: user.active
      },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
    );

    // Registrar actividad
    await db.query(
      'INSERT INTO activity_logs (user_id, action, details, ip_address) VALUES ($1, $2, $3, $4)',
      [user.id, 'LOGIN', 'Usuario inició sesión', req.ip]
    );

    res.json({
      success: true,
      message: 'Login exitoso',
      data: {
        token,
        user: {
          id: user.id,
          username: user.username,
          role: user.role
        }
      }
    });

  } catch (error) {
    console.error('Error en login:', error);
    res.status(500).json({
      success: false,
      message: 'Error en el servidor.'
    });
  }
};

/**
 * Verificar token actual
 * GET /api/auth/verify
 */
const verifyToken = async (req, res) => {
  try {
    // El middleware ya verificó el token y añadió req.user
    const result = await db.query(
      'SELECT id, username, role, active FROM users WHERE id = $1',
      [req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado.'
      });
    }

    const user = result.rows[0];

    if (!user.active) {
      return res.status(403).json({
        success: false,
        message: 'Usuario desactivado.'
      });
    }

    res.json({
      success: true,
      data: {
        user: {
          id: user.id,
          username: user.username,
          role: user.role
        }
      }
    });

  } catch (error) {
    console.error('Error al verificar token:', error);
    res.status(500).json({
      success: false,
      message: 'Error en el servidor.'
    });
  }
};

/**
 * Logout (opcional - principalmente del lado del cliente)
 * POST /api/auth/logout
 */
const logout = async (req, res) => {
  try {
    // Registrar actividad
    await db.query(
      'INSERT INTO activity_logs (user_id, action, details, ip_address) VALUES ($1, $2, $3, $4)',
      [req.user.id, 'LOGOUT', 'Usuario cerró sesión', req.ip]
    );

    res.json({
      success: true,
      message: 'Logout exitoso'
    });

  } catch (error) {
    console.error('Error en logout:', error);
    res.status(500).json({
      success: false,
      message: 'Error en el servidor.'
    });
  }
};

module.exports = {
  login,
  verifyToken,
  logout
};
