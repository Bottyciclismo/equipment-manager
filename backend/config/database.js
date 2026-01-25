const { Pool } = require('pg');

// Configuración simple usando la variable DATABASE_URL
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false // Esto es OBLIGATORIO en Render
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
