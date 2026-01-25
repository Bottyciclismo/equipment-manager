const { Pool } = require('pg');

// Usamos las variables individuales que configuraste en Render
const pool = new Pool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT || 5432,
  // IMPORTANTE: Render exige SSL, y 'rejectUnauthorized: false' evita errores de certificados
  ssl: {
    rejectUnauthorized: false
  }
});

pool.on('connect', () => {
  console.log('✅ Conexión a PostgreSQL exitosa');
});

pool.on('error', (err) => {
  console.error('❌ Error en la conexión a PostgreSQL:', err);
  process.exit(-1);
});

module.exports = pool;
