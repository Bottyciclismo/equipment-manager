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

// Función para asegurar que las tablas existen
const inicializarTablas = async () => {
    try {
        await pool.query(`
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
        console.log("✅ Tablas verificadas/creadas");
    } catch (err) {
        console.error("❌ Error al crear tablas:", err.message);
    }
};
inicializarTablas();

// --- RUTAS DE MARCAS ---

// Obtener todas
app.get('/api/brands', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM brands ORDER BY name ASC');
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Crear marca
app.post('/api/brands', async (req, res) => {
    const { name } = req.body;
    try {
        const result = await pool.query(
            'INSERT INTO brands (name) VALUES ($1) RETURNING *',
            [name]
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Error al guardar marca" });
    }
});

// Eliminar marca
app.delete('/api/brands/:id', async (req, res) => {
    try {
        await pool.query('DELETE FROM brands WHERE id = $1', [req.params.id]);
        res.json({ message: "Marca eliminada" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// --- RUTAS DE MODELOS ---

// Obtener todos
app.get('/api/models', async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT m.*, b.name as brand_name 
            FROM models m 
            JOIN brands b ON m.brand_id = b.id 
            ORDER BY m.name ASC
        `);
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Crear modelo
app.post('/api/models', async (req, res) => {
    const { brand_id, name, image_url, possible_passwords, reset_instructions } = req.body;
    try {
        const result = await pool.query(
            'INSERT INTO models (brand_id, name, image_url, possible_passwords, reset_instructions) VALUES ($1, $2, $3, $4, $5) RETURNING *',
            [brand_id, name, image_url, possible_passwords, reset_instructions]
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: "Error al guardar modelo" });
    }
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
    console.log(`Servidor corriendo en puerto ${PORT}`);
});
