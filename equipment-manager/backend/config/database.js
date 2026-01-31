const { Pool } = require('pg');

// Configuración para usar la variable DATABASE_URL que ya tienes en Render
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false // <--- ¡ESTO ES CLAVE! Sin esto, Render te bloquea.
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
