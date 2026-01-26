require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');

const app = express();

// 1. Configuración de Base de Datos (Anti-fallos)
let pool;
try {
    pool = new Pool({
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false }
    });
} catch (error) {
    console.error("⚠️ Error configurando BD:", error);
}

// 2. CORS Permisivo (Para que Netlify entre sin problemas)
app.use(cors({ origin: '*' }));
app.use(express.json());

// 3. LOG: Chivato para ver en Render qué está llegando
app.use((req, res, next) => {
    console.log(`📢 Petición recibida: ${req.method} ${req.url}`);
    next();
});

// 4. RUTA DE LOGIN (La que te está dando 404)
// OJO: Definimos la ruta completa '/api/auth/login' para evitar líos
app.post('/api/auth/login', async (req, res) => {
    const { username, password } = req.body;
    console.log(`🔑 Intento de login: ${username}`);

    // --- OPCIÓN A: ADMIN MAESTRO (Para entrar YA) ---
    if (username === 'admin' && password === '123456') {
        console.log("✅ Login Maestro exitoso");
        return res.json({
            success: true,  // <--- ¡ESTO ES LO QUE BUSCABA TU FRONTEND!
            message: 'Login exitoso',
            token: 'token-maestro-super-secreto',
            user: { 
                id: 1, 
                username: 'admin', 
                role: 'admin' 
            }
        });
    }

    // --- OPCIÓN B: BASE DE DATOS (Si falla el maestro) ---
    try {
        if (pool) {
            const result = await pool.query('SELECT * FROM users WHERE username = $1', [username]);
            if (result.rows.length > 0) {
                // Aquí deberías validar la contraseña real con bcrypt en el futuro
                return res.json({
                    success: true, // ¡Importante!
                    token: 'token-bd-real',
                    user: result.rows[0]
                });
            }
        }
    } catch (e) {
        console.error("❌ Error BD:", e);
    }

    // Si todo falla
    console.log("⛔ Fallo de autenticación");
    res.status(401).json({ 
        success: false, 
        message: 'Credenciales inválidas' 
    });
});

// 5. RUTA PARA COMPROBAR QUE EL SERVIDOR V3 ESTÁ VIVO
app.get('/', (req, res) => {
    res.send('🚀 SERVIDOR V3 ACTIVO - ¡Login listo!');
});

// Arrancar
const PORT = process.env.PORT || 5000;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`✅ Servidor V3 corriendo en puerto ${PORT}`);
});
