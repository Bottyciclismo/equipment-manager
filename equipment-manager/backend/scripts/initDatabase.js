// =====================================================
// DATABASE INITIALIZATION SCRIPT
// Creates admin user with hashed password
// =====================================================

const bcrypt = require('bcrypt');
const db = require('../config/database');
require('dotenv').config();

async function initDatabase() {
  try {
    console.log('🚀 Iniciando configuración de base de datos...\n');

    // Verificar conexión
    const connectionTest = await db.query('SELECT NOW()');
    console.log('✅ Conexión a PostgreSQL exitosa');
    console.log(`   Timestamp: ${connectionTest.rows[0].now}\n`);

    // Verificar si ya existe un administrador
    const existingAdmin = await db.query(
      "SELECT id, username FROM users WHERE role = 'admin'"
    );

    if (existingAdmin.rows.length > 0) {
      console.log('⚠️  Ya existe un administrador en el sistema:');
      console.log(`   Username: ${existingAdmin.rows[0].username}`);
      console.log(`   ID: ${existingAdmin.rows[0].id}\n`);
      
      const readline = require('readline').createInterface({
        input: process.stdin,
        output: process.stdout
      });

      return new Promise((resolve) => {
        readline.question('¿Desea resetear la contraseña del admin? (s/n): ', async (answer) => {
          readline.close();
          
          if (answer.toLowerCase() === 's' || answer.toLowerCase() === 'si') {
            const password = process.env.ADMIN_PASSWORD || 'Admin@2024';
            const saltRounds = 10;
            const password_hash = await bcrypt.hash(password, saltRounds);

            await db.query(
              'UPDATE users SET password_hash = $1, updated_at = CURRENT_TIMESTAMP WHERE role = $2',
              [password_hash, 'admin']
            );

            console.log('\n✅ Contraseña del administrador actualizada');
            console.log(`   Username: admin`);
            console.log(`   Password: ${password}\n`);
          } else {
            console.log('\n❌ Operación cancelada\n');
          }
          
          await db.closePool();
          resolve();
        });
      });
    }

    // Crear administrador por defecto
    const username = process.env.ADMIN_USERNAME || 'admin';
    const password = process.env.ADMIN_PASSWORD || 'Admin@2024';

    console.log('📝 Creando usuario administrador...');

    // Hash de la contraseña
    const saltRounds = 10;
    const password_hash = await bcrypt.hash(password, saltRounds);

    // Insertar administrador
    const result = await db.query(
      `INSERT INTO users (username, password_hash, role, active)
       VALUES ($1, $2, $3, $4)
       RETURNING id, username, role, created_at`,
      [username, password_hash, 'admin', true]
    );

    console.log('✅ Administrador creado exitosamente:');
    console.log(`   Username: ${result.rows[0].username}`);
    console.log(`   Password: ${password}`);
    console.log(`   Role: ${result.rows[0].role}`);
    console.log(`   ID: ${result.rows[0].id}`);
    console.log(`   Created: ${result.rows[0].created_at}\n`);

    // Registrar en logs
    await db.query(
      'INSERT INTO activity_logs (user_id, action, details) VALUES ($1, $2, $3)',
      [result.rows[0].id, 'ADMIN_CREATED', 'Administrador inicial creado por script']
    );

    console.log('✅ Registro de actividad creado\n');

    // Estadísticas de la base de datos
    const stats = await db.query(`
      SELECT 
        (SELECT COUNT(*) FROM users) as total_users,
        (SELECT COUNT(*) FROM brands) as total_brands,
        (SELECT COUNT(*) FROM models) as total_models,
        (SELECT COUNT(*) FROM activity_logs) as total_logs
    `);

    console.log('📊 Estadísticas de la base de datos:');
    console.log(`   Usuarios: ${stats.rows[0].total_users}`);
    console.log(`   Marcas: ${stats.rows[0].total_brands}`);
    console.log(`   Modelos: ${stats.rows[0].total_models}`);
    console.log(`   Logs: ${stats.rows[0].total_logs}\n`);

    console.log('🎉 Configuración completada exitosamente!\n');
    console.log('⚠️  IMPORTANTE: Guarde las credenciales en un lugar seguro\n');
    console.log('💡 Para iniciar el servidor, ejecute: npm start\n');

  } catch (error) {
    console.error('❌ Error durante la inicialización:', error.message);
    console.error(error);
    process.exit(1);
  } finally {
    await db.closePool();
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  initDatabase();
}

module.exports = { initDatabase };
