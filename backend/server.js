require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');

const app = express();

// Configuración Base de Datos
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

// Configuración CORS (Permite a Netlify entrar)
app.use(cors({ origin: '*' }));
app.use(express.json());

// RUTA DE PRUEBA (Para ver si estás vivo)
app.get('/', (req, res) => res.send('🚀 Servidor de emergencia ACTIVO.'));

// RUTA DE LOGIN (Directa, sin archivos extra)
app.post('/api/auth/login', async (req, res) => {
    const { username, password } = req.body;
    console.log(`Intento de login: ${username}`);
    
    // Usuario maestro de emergencia (para que puedas entrar SÍ o SÍ)
    if (username === 'admin' && password === '123456') {
        return res.json({
            token: 'token-falso-de-prueba',
            user: { id: 1, username: 'admin', role: 'admin' }
        });
    }

    try {
        // Intentar buscar en base de datos real
        const result = await pool.query('SELECT * FROM users WHERE username = $1', [username]);
        if (result.rows.length > 0) {
            // Aquí iría la comprobación de password real
            return res.json({ token: 'token-real', user: result.rows[0] });
        }
    } catch (e) {
        console.error(e);
    }

    return res.status(401).json({ message: 'Credenciales inválidas' });
});

// Inicializar base de datos (TABLA USERS)
app.get('/api/init-db', async (req, res) => {
    try {
        await pool.query(`
            CREATE TABLE IF NOT EXISTS users (
                id SERIAL PRIMARY KEY,
                username VARCHAR(50) UNIQUE NOT NULL,
                password VARCHAR(255) NOT NULL,
                role VARCHAR(20) DEFAULT 'user'
            );
        `);
        res.send('✅ Tabla de usuarios creada.');
    } catch (e) {
        res.status(500).send('Error BD: ' + e.message);
    }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, '0.0.0.0', () => console.log(`✅ Server corriendo en puerto ${PORT}`));
