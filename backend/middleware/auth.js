// =====================================================
// AUTHENTICATION & AUTHORIZATION MIDDLEWARE
// =====================================================

const jwt = require('jsonwebtoken');
require('dotenv').config();

/**
 * Middleware para verificar el token JWT
 */
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({ 
      success: false,
      message: 'Acceso denegado. Token no proporcionado.' 
    });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ 
        success: false,
        message: 'Token inválido o expirado.' 
      });
    }

    // Añadir información del usuario a la request
    req.user = user;
    next();
  });
};

/**
 * Middleware para verificar que el usuario sea administrador
 */
const requireAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ 
      success: false,
      message: 'Usuario no autenticado.' 
    });
  }

  if (req.user.role !== 'admin') {
    return res.status(403).json({ 
      success: false,
      message: 'Acceso denegado. Se requieren privilegios de administrador.' 
    });
  }

  next();
};

/**
 * Middleware para verificar que el usuario esté activo
 */
const requireActive = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ 
      success: false,
      message: 'Usuario no autenticado.' 
    });
  }

  if (!req.user.active) {
    return res.status(403).json({ 
      success: false,
      message: 'Usuario desactivado. Contacte al administrador.' 
    });
  }

  next();
};

/**
 * Middleware combinado: autenticar + verificar activo
 */
const authenticate = [authenticateToken, requireActive];

/**
 * Middleware combinado: autenticar + verificar activo + verificar admin
 */
const authenticateAdmin = [authenticateToken, requireActive, requireAdmin];

module.exports = {
  authenticateToken,
  requireAdmin,
  requireActive,
  authenticate,
  authenticateAdmin
};
