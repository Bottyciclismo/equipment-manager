const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

const inicializarTablas = async () => {
    try {
        await pool.query(`
            CREATE TABLE IF NOT EXISTS users (
                id SERIAL PRIMARY KEY,
                username VARCHAR(50) UNIQUE NOT NULL,
                password VARCHAR(100) NOT NULL,
                role VARCHAR(20) DEFAULT 'admin'
            );
            CREATE TABLE IF NOT EXISTS brands (
                id SERIAL PRIMARY KEY,
                name VARCHAR(100) UNIQUE NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
            CREATE TABLE IF NOT EXISTS models (
                id SERIAL PRIMARY KEY,
                brand_id INTEGER REFERENCES brands(id) ON DELETE CASCADE,
                name VARCHAR(100) NOT NULL,
                image_url TEXT,
                possible_passwords TEXT,
                reset_instructions TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);

        // Esto crea al usuario admin/123456 si no existe todavía
        await pool.query(`
            INSERT INTO users (username, password, role) 
            VALUES ('admin', '123456', 'admin') 
            ON CONFLICT (username) DO NOTHING
        `);

        console.log("✅ Tablas y Usuario Admin verificados");
    } catch (err) {
        console.error("❌ Error en inicialización:", err.message);
    }
};
inicializarTablas();

// --- RUTA DE LOGIN (La que te faltaba) ---
app.post('/api/auth/login', async (req, res) => {
    const { username, password } = req.body;
    try {
        const result = await pool.query(
            'SELECT * FROM users WHERE username = $1 AND password = $2',
            [username, password]
        );

        if (result.rows.length > 0) {
            const user = result.rows[0];
            res.json({ 
                success: true, 
                user: { id: user.id, username: user.username, role: user.role },
                token: 'token-falso-de-sesion' // Simulación de token
            });
        } else {
            res.status(401).json({ success: false, error: "Usuario o contraseña incorrectos" });
        }
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// --- RUTAS DE MARCAS ---
app.get('/api/brands', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM brands ORDER BY name ASC');
        res.json({ success: true, data: result.rows });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

app.post('/api/brands', async (req, res) => {
    const { name } = req.body;
    try {
        const result = await pool.query('INSERT INTO brands (name) VALUES ($1) RETURNING *', [name]);
        res.status(201).json({ success: true, data: result.rows[0] });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

app.delete('/api/brands/:id', async (req, res) => {
    try {
        await pool.query('DELETE FROM brands WHERE id = $1', [req.params.id]);
        res.json({ success: true, message: "Marca eliminada" });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// --- RUTAS DE MODELOS ---
app.get('/api/models', async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT m.*, b.name as brand_name 
            FROM models m 
            LEFT JOIN brands b ON m.brand_id = b.id 
            ORDER BY m.id DESC
        `);
        res.json({ success: true, data: result.rows });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

app.get('/api/brands/:brandId/models', async (req, res) => {
    try {
        const { brandId } = req.params;
        const result = await pool.query('SELECT * FROM models WHERE brand_id = $1 ORDER BY name ASC', [brandId]);
        res.json({ success: true, data: result.rows });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

app.post('/api/models', async (req, res) => {
    const { brand_id, name, image_url, possible_passwords, reset_instructions } = req.body;
    try {
        const result = await pool.query(
            'INSERT INTO models (brand_id, name, image_url, possible_passwords, reset_instructions) VALUES ($1, $2, $3, $4, $5) RETURNING *',
            [brand_id, name, image_url, possible_passwords, reset_instructions]
        );
        res.status(201).json({ success: true, data: result.rows[0] });
    } catch (err) {
        res.status(50
