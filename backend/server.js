require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');

const app = express();

// 1. CONFIGURACIÓN CORS BLINDADA (Para eliminar el error de Netlify)
app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

// Forzamos las cabeceras manualmente por si acaso
app.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization");
    next();
});

app.use(express.json());

// 2. BASE DE DATOS
let pool;
try {
    pool = new Pool({
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false }
    });
} catch (error) { console.error("Error BD", error); }

// 3. LA LÓGICA DE LOGIN (Función única)
const handleLogin = async (req, res) => {
    const { username, password } = req.body;
    console.log(`🔑 INTENTO LOGIN en ruta: ${req.path} - Usuario: ${username}`);

    // Login Maestro
    if (username === 'admin' && password === '123456') {
        return res.json({
            success: true,
            message: 'Login Admin Maestro OK',
            token: 'token-maestro-super-secreto',
            user: { id: 1, username: 'admin', role: 'admin' }
        });
    }

    // Login Base de Datos
    try {
        if (pool) {
            const result = await pool.query('SELECT * FROM users WHERE username = $1', [username]);
            if (result.rows.length > 0) {
                // Aquí iría la validación de pass real
                return res.json({ success: true, token: 'bd-token', user: result.rows[0] });
            }
        }
    } catch (e) { console.error(e); }

    // Fallo
    res.status(401).json({ success: false, message: 'Credenciales inválidas' });
};

// =================================================================
// 4. LAS RUTAS UNIVERSALES (El truco para que funcione SÍ o SÍ)
// =================================================================

// Opción 1: Lo normal (/api/auth/login)
app.post('/api/auth/login', handleLogin);

// Opción 2: Por si la variable de Netlify no tiene el /api (/auth/login)
app.post('/auth/login', handleLogin);

// Opción 3: Por si la variable se duplicó (/api/api/auth/login)
app.post('/api/api/auth/login', handleLogin);

// Ruta base para confirmar vida
app.get('/', (req, res) => res.send('🚀 SERVIDOR UNIVERSAL ACTIVO - Escuchando en todas las rutas'));

const PORT = process.env.PORT || 5000;
app.listen(PORT, '0.0.0.0', () => console.log(`✅ Servidor corriendo en puerto ${PORT}`));
