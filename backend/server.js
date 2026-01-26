require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');

const app = express();

// 1. CORS TOTAL Y EXPLÍCITO (Para que Chrome no se queje)
app.use(cors({ origin: '*' }));
app.options('*', cors()); // Habilita pre-flight request para todo

app.use(express.json());

// 2. Base de Datos (Protegida para que no tumbe el servidor)
let pool;
try {
    pool = new Pool({
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false }
    });
} catch (error) { console.error("⚠️ Error cargando configuración BD"); }

// 3. CHIVATO (LOGS)
app.use((req, res, next) => {
    console.log(`📨 Petición: ${req.method} ${req.url}`);
    next();
});

// 4. LÓGICA DE LOGIN MEJORADA
const handleLogin = async (req, res) => {
    console.log("📦 Datos recibidos (Body):", req.body); // <--- VEREMOS ESTO EN LOGS
    
    // Limpiamos los datos (quitamos espacios y pasamos a minúsculas)
    const { username, password } = req.body || {};
    const cleanUser = username ? username.trim().toLowerCase() : '';
    const cleanPass = password ? password.trim() : '';

    console.log(`🔑 Intentando entrar con usuario: '${cleanUser}'`);

    // --- LLAVE MAESTRA (Funciona siempre) ---
    if (cleanUser === 'admin' && cleanPass === '123456') {
        console.log("✅ ¡Acceso Maestro Concedido!");
        return res.json({
            success: true,
            message: 'Login Admin OK',
            token: 'token-maestro-invencible',
            user: { id: 1, username: 'admin', role: 'admin' }
        });
    }

    // --- INTENTO CON BASE DE DATOS ---
    try {
        if (pool) {
            const result = await pool.query('SELECT * FROM users WHERE username = $1', [cleanUser]);
            if (result.rows.length > 0) {
                // AQUÍ VALIDARÍAS PASSWORD REAL
                return res.json({ success: true, token: 'bd-token', user: result.rows[0] });
            }
        }
    } catch (e) { 
        console.error("❌ Error en BD (Ignorable si entras como admin):", e.message); 
    }

    // Si llegamos aquí, es fallo
    console.log("⛔ Acceso denegado.");
    res.status(401).json({ success: false, message: 'Usuario o contraseña incorrectos' });
};

// 5. TODAS LAS RUTAS POSIBLES
app.post('/api/auth/login', handleLogin);
app.post('/auth/login', handleLogin);
app.post('/login', handleLogin);

// Ruta base
app.get('/', (req, res) => res.send('🚀 SERVIDOR FINAL ACTIVO (cci3)'));

const PORT = process.env.PORT || 5000;
app.listen(PORT, '0.0.0.0', () => console.log(`✅ Servidor listo en puerto ${PORT}`));
