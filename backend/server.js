// ==========================================
// SERVIDOR PRINCIPAL (server.js)
// ==========================================
require('dotenv').config(); // Cargar variables de entorno
const express = require('express');
const cors = require('cors');

// Importamos la configuración de la base de datos
// (Asegúrate de que la ruta sea correcta. Si lo tienes en 'config', déjalo así)
try {
    require('./config/database'); 
} catch (error) {
    console.error("⚠️ No se encuentra './config/database', intentando './database/db'...");
    // Intento alternativo por si acaso lo moviste
    try { require('./database/db'); } catch(e) { console.log("⚠️ Nota: La BD se conectará cuando se usen las rutas."); }
}

// Importamos el "Super Gestor" de rutas (tu index.js)
const mainRoutes = require('./routes/index');

const app = express();

// ==========================================
// MIDDLEWARES (Configuraciones previas)
// ==========================================
app.use(cors()); // Permite conexiones desde el Frontend
app.use(express.json()); // Permite leer datos JSON
app.use(express.urlencoded({ extended: true })); // Permite leer formularios

// ==========================================
// RUTAS
// ==========================================
// Aquí conectamos todas tus rutas bajo el prefijo '/api'
// Ejemplo: /api/auth/login, /api/brands, etc.
app.use('/api', mainRoutes);

// Ruta de prueba simple para saber si el servidor vive
app.get('/', (req, res) => {
    res.send('🚀 Servidor funcionando correctamente en Render.');
});

// ==========================================
// INICIO DEL SERVIDOR (Configuración Render)
// ==========================================
const PORT = process.env.PORT || 5000;
const HOST = '0.0.0.0'; // <--- IMPRESCINDIBLE PARA RENDER

app.listen(PORT, HOST, () => {
    console.log(`✅ Servidor corriendo en http://${HOST}:${PORT}`);
});
