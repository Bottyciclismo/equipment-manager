require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');

const app = express();

// 1. Configuración CORS (Permitir todo)
app.use(cors({ origin: '*' }));
app.use(express.json());

// 2. Base de Datos
let pool;
try {
    pool = new Pool({
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false }
    });
} catch (error) { console.error("Error BD", error); }

// 3. LOG: Para ver qué dirección está llegando realmente
app.use((req, res, next) => {
    console.log(`📢 Petición entrante a: ${req.method} ${req.url}`);
    next();
});

// 4. FUNCIÓN DE LOGIN (La definimos una vez para usarla en muchas rutas)
const handleLogin = async (req, res) => {
    const { username, password } = req.body;
    console.log(`🔑 Intento de login: ${username}`);

    // Admin Maestro
    if (username === 'admin' && password === '123456') {
        return res.json({
            success: true,
            token: 'token-maestro',
            user: { id: 1, username: 'admin', role: 'admin' }
        });
    }

    // Base de Datos
    try {
        if (pool) {
            const result = await pool.query('SELECT * FROM users WHERE username = $1', [username]);
            if (result.rows.length > 0) {
                return res.json({ success: true, token: 'bd-token', user: result.rows[0] });
            }
        }
    } catch (e) { console.error(e); }

    res.status(401).json({ success: false, message: 'Credenciales incorrectas' });
};

// ==========================================================
// 5. RUTAS MÚLTIPLES (¡EL TRUCO PARA QUE FUNCIONE!)
// Escuchamos en todas las variantes posibles por si api.js se lía
// ==========================================================

app.post('/api/auth/login', handleLogin);      // Lo estándar
app.post('/auth/login', handleLogin);          // Por si falta /api
app.post('/api/api/auth/login', handleLogin);  // Por si se duplica
app.post('/login', handleLogin);               // Por si acaso

// 6. Ruta de comprobación y Error 404 detallado
app.get('/', (req, res) => res.send('🚀 SERVIDOR "COMODÍN" ACTIVO (cci3)'));

// Si falla, nos dirá exactamente qué ruta buscaba el frontend
app.use('*', (req, res) => {
    console.log(`❌ 404 - Ruta no encontrada: ${req.originalUrl}`);
    res.status(404).send(`Error 404: No existe la ruta ${req.originalUrl}`);
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, '0.0.0.0', () => console.log(`✅ Server listo en puerto ${PORT}`));
