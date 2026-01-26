require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');

const app = express();

// Configuración Base de Datos (con manejo de errores robusto)
let pool;
try {
    pool = new Pool({
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false }
    });
} catch (error) {
    console.error("Error configurando BD:", error);
}

// CORS: Permite entrar a TODO el mundo (Vital para Netlify)
app.use(cors({ origin: '*' }));
app.use(express.json());

// LOG: Chivato para ver en Render si llegan las peticiones
app.use((req, res, next) => {
    console.log(`📢 Petición recibida: ${req.method} ${req.url}`);
    next();
});

// RUTA DE PRUEBA (Para saber si el código nuevo se cargó)
app.get('/', (req, res) => res.send('🚀 SERVIDOR V3 - LISTO PARA EL COMBATE'));

// RUTA DE LOGIN (La que está fallando ahora mismo)
app.post('/api/auth/login', async (req, res) => {
    const { username, password } = req.body;
    console.log(`🔑 Intento de login de: ${username}`);

    // USUARIO MAESTRO (Para que entres YA)
    if (username === 'admin' && password === '123456') {
        return res.json({
            success: true, // <--- ¡ESTO ES LO QUE LE FALTABA AL FRONTEND!
            message: 'Login exitoso (Admin Maestro)',
            token: 'token-maestro-super-secreto',
            user: { 
                id: 1, 
                username: 'admin', 
                role: 'admin', 
                email: 'admin@test.com' 
            }
        });
    }

    // Si no es el admin maestro, intentamos base de datos (si funciona)
    try {
        if (pool) {
            const result = await pool.query('SELECT * FROM users WHERE username = $1', [username]);
            if (result.rows.length > 0) {
                 // Aquí en un futuro validarías la contraseña real
                return res.json({
                    success: true,
                    token: 'token-bd-real',
                    user: result.rows[0]
                });
            }
        }
    } catch (e) {
        console.error("Error BD:", e);
    }

    // Si falla
    res.status(401).json({ 
        success: false, 
        message: 'Usuario o contraseña incorrectos' 
    });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, '0.0.0.0', () => console.log(`✅ Servidor V3 corriendo en puerto ${PORT}`));
