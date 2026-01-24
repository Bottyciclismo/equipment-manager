// =====================================================
// DATABASE CONNECTION CONFIGURATION
// =====================================================

const { Pool } = require('pg');
require('dotenv').config();

// Configuración del pool de conexiones
const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'equipment_manager',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD,
  max: 20, // Máximo de conexiones en el pool
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// Manejo de errores del pool
pool.on('error', (err, client) => {
  console.error('Error inesperado en el cliente inactivo', err);
  process.exit(-1);
});

// Test de conexión
pool.on('connect', () => {
  console.log('✅ Conectado a PostgreSQL');
});

// Función helper para queries
const query = (text, params) => pool.query(text, params);

// Función para obtener un cliente del pool
const getClient = () => pool.connect();

// Función para cerrar el pool (útil para testing)
const closePool = () => pool.end();

module.exports = {
  query,
  getClient,
  closePool,
  pool
};
