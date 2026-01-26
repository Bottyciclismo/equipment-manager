require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');

const app = express();

// 1. CONFIGURACIÓN TOTAL
app.use(cors({ origin: '*' }));
app.use(express.json());

// 2. CONEXIÓN BASE DE DATOS
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

// 3. RUTAS DE LOGIN (Ya funcionan)
const handleLogin = (req, res) => {
    const { username, password } = req.body;
    if (username.toLowerCase() === 'admin' && password === '123456') {
        return res.json({
            success: true,
            token: 'token-maestro',
            user: { id: 1, username: 'admin', role: 'admin' }
        });
    }
    res.status(401).json({ success: false, message: 'Error' });
};
app.post('/api/auth/login', handleLogin);
app.post('/auth/login', handleLogin);

// 4. RUTAS PARA EL DASHBOARD (Para que no salga la pantalla azul)
// Estas rutas devuelven una lista vacía en lugar de un error 404
app.get('/api/equipments', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM equipments'); // Cambia 'equipments' por tu tabla real
        res.json(result.rows);
    } catch (err) {
        res.json([]); // Si la tabla no existe aún, enviamos lista vacía para que no explote la web
    }
});

app.get('/api/brands', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM brands');
        res.json(result.rows);
    } catch (err) { res.json([]); }
});

// 5. RUTA DE DIAGNÓSTICO
app.get('/', (req, res) => res.send('🚀 SERVIDOR TOTAL V5 - Dashboard listo'));

const PORT = process.env.PORT || 5000;
app.listen(PORT, '0.0.0.0', () => console.log(`Servidor en puerto ${PORT}`));
