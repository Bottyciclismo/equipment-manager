require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');

const app = express();

// 1. CORS TOTAL (Permite entrar a Netlify)
app.use(cors({ origin: '*' }));
app.use(express.json());

// 2. Conexión Base de Datos
let pool;
try {
    pool = new Pool({
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false }
    });
} catch (error) { console.error("Error BD", error); }

// 3. LOG: Para ver en Render qué está llegando
app.use((req, res, next) => {
    console.log(`📢 Petición recibida: ${req.method} ${req.url}`);
    next();
});

// 4. LA RUTA EXACTA QUE BUSCA TU FRONTEND
// Tu api.js envía a: /api/auth/login
app.post('/api/auth/login', async (req, res) => {
    const { username, password } = req.body;
    console.log(`🔑 Login: ${username}`);

    // Login Maestro
    if (username === 'admin' && password === '123456') {
        return res.json({
            success: true,
            token: 'token-maestro',
            user: { id: 1, username: 'admin', role: 'admin' }
        });
    }
    
    // Login BD
    try {
        if (pool) {
            const result = await pool.query('SELECT * FROM users WHERE username = $1', [username]);
            if (result.rows.length > 0) {
                return res.json({ success: true, token: 'bd-token', user: result.rows[0] });
            }
        }
    } catch (e) { console.error(e); }

    res.status(401).json({ success: false, message: 'Credenciales inválidas' });
});

// 5. RUTA RAÍZ (Diagnóstico)
app.get('/', (req, res) => {
    res.send('✅ SERVIDOR ACTIVO - Ruta /api/auth/login esperando...');
});

// 6. CHIVATO DE ERRORES 404
// Si llega una petición que no existe, te dirá cuál es
app.use('*', (req, res) => {
    res.status(404).send(`❌ Error 404: No encuentro la ruta ${req.originalUrl}`);
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, '0.0.0.0', () => console.log(`Servidor en puerto ${PORT}`));
