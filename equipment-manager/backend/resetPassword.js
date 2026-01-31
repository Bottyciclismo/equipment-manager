const bcrypt = require('bcrypt');
const { Pool } = require('pg');

const pool = new Pool({
  host: 'localhost',
  port: 5432,
  database: 'equipment_manager',
  user: 'postgres',
  password: 'bottybotty1234'
});

async function resetPassword() {
  try {
    console.log('🔄 Reseteando contraseña del admin...');
    
    const password = 'Admin@2024';
    const hash = await bcrypt.hash(password, 10);
    
    const result = await pool.query(
      'UPDATE users SET password_hash = $1 WHERE username = $2 RETURNING username, role',
      [hash, 'admin']
    );
    
    if (result.rows.length > 0) {
      console.log('✅ Contraseña actualizada exitosamente');
      console.log('   Usuario:', result.rows[0].username);
      console.log('   Rol:', result.rows[0].role);
      console.log('\n🔑 Puedes iniciar sesión con:');
      console.log('   Usuario: admin');
      console.log('   Contraseña: Admin@2024');
    } else {
      console.log('❌ No se encontró el usuario admin');
    }
    
    await pool.end();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

resetPassword();