require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');

const app = express();
app.use(cors({ origin: '*' }));
app.use(express.json());

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

// --- FUNCIÓN MÁGICA: CREA TABLAS Y DATOS SI NO EXISTEN ---
const inicializarBD = async () => {
    try {
        console.log("🛠️ Verificando tablas...");
        // Creamos la tabla de equipos si no existe
        await pool.query(`
            CREATE TABLE IF NOT EXISTS equipments (
                id SERIAL PRIMARY KEY,
                name VARCHAR(100),
                status VARCHAR(50) DEFAULT 'Disponible',
                description TEXT
            );
        `);
        
        // Verificamos si está vacía
        const res = await pool.query('SELECT COUNT(*) FROM equipments');
        if (parseInt(res.rows[0].count) === 0) {
            console.log("📝 Insertando datos de prueba...");
            await pool.query(`
                INSERT INTO equipments (name, status, description) 
                VALUES ('Bicicleta Trek Pro', 'Disponible', 'Bici de test'),
                       ('Casco Specialized', 'En uso', 'Talla M');
            `);
        }
        console.log("✅ Base de datos lista.");
    } catch (err) {
        console.error("❌ Error inicializando BD:", err.message);
    }
};

inicializarBD(); // Se ejecuta al arrancar el servidor

// --- RUTAS ---

// Login (Maestro)
app.post('/api/auth/login', (req, res) => {
    const { username, password } = req.body;
    if (username?.toLowerCase() === 'admin' && password === '123456') {
        return res.json({
            success: true,
            token: 'token-maestro',
            user: { id: 1, username: 'admin', role: 'admin' }
        });
    }
    res.status(401).json({ success: false, message: 'Credenciales inválidas' });
});

// Equipos (Para el Dashboard)
app.get('/api/equipments', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM equipments ORDER BY id ASC');
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Rutas vacías para que no den 404 y no rompan el front
app.get('/api/brands', (req, res) => res.json([]));
app.get('/api/models', (req, res) => res.json([]));

app.get('/', (req, res) => res.send('🚀 Servidor funcionando con Auto-Tablas'));

const PORT = process.env.PORT || 5000;
app.listen(PORT, '0.0.0.0', () => console.log(`Servidor en puerto ${PORT}`));
