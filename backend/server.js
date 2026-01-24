// =====================================================
// EQUIPMENT MANAGER - MAIN SERVER
// =====================================================

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const path = require('path');
require('dotenv').config();

// Importar rutas
const routes = require('./routes');

// Inicializar Express
const app = express();
const PORT = process.env.PORT || 5000;
const HOST = process.env.HOST || '0.0.0.0';

// =====================================================
// MIDDLEWARE DE SEGURIDAD
// =====================================================

// Helmet - Headers de seguridad
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));

// CORS - Configuración
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Rate limiting - Prevenir abuso
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutos
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
  message: {
    success: false,
    message: 'Demasiadas peticiones desde esta IP, intente más tarde.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use('/api/', limiter);

// =====================================================
// MIDDLEWARE GENERAL
// =====================================================

// Body parser
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Logger
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

// Servir archivos estáticos (uploads)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// =====================================================
// RUTAS
// =====================================================

// API Routes
app.use('/api', routes);

// Root route
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Equipment Manager API',
    version: '1.0.0',
    endpoints: {
      health: '/api/health',
      auth: '/api/auth/login',
      brands: '/api/brands',
      models: '/api/models',
      users: '/api/users (admin only)',
      upload: '/api/upload (admin only)'
    }
  });
});

// =====================================================
// ERROR HANDLERS
// =====================================================

// 404 Handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Ruta no encontrada',
    path: req.originalUrl
  });
});

// Error Handler Global
app.use((err, req, res, next) => {
  console.error('Error:', err);

  const statusCode = err.statusCode || 500;
  const message = err.message || 'Error interno del servidor';

  res.status(statusCode).json({
    success: false,
    message: message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// =====================================================
// INICIAR SERVIDOR
// =====================================================

app.listen(PORT, HOST, () => {
  console.log('\n╔════════════════════════════════════════════════════╗');
  console.log('║   EQUIPMENT MANAGER API - SERVER RUNNING          ║');
  console.log('╚════════════════════════════════════════════════════╝\n');
  console.log(`🚀 Servidor corriendo en: http://${HOST}:${PORT}`);
  console.log(`🌍 Entorno: ${process.env.NODE_ENV || 'development'}`);
  console.log(`📁 Uploads: ${path.join(__dirname, 'uploads')}`);
  console.log(`\n📚 Documentación de API:`);
  console.log(`   - Health check: http://${HOST}:${PORT}/api/health`);
  console.log(`   - Login: POST http://${HOST}:${PORT}/api/auth/login`);
  console.log(`\n⚠️  Presiona CTRL+C para detener el servidor\n`);
});

// Manejo de cierre graceful
process.on('SIGTERM', () => {
  console.log('\n🛑 SIGTERM recibido, cerrando servidor...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('\n🛑 SIGINT recibido, cerrando servidor...');
  process.exit(0);
});

module.exports = app;
