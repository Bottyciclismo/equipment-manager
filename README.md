# 🔧 Equipment Manager

Sistema web completo para la gestión de marcas y modelos de equipos con información de reset y contraseñas.

## 📋 Características

### 🔐 Sistema de Usuarios
- **Administrador único**: Gestión completa del sistema
- **Usuarios normales**: Solo consulta de información
- **Autenticación JWT** con contraseñas hasheadas (bcrypt)
- **Sesiones seguras** y protección de rutas

### 📊 Funcionalidades
- Consulta de equipos por marca y modelo
- Búsqueda rápida por nombre
- Visualización de imágenes de equipos
- Panel con contraseñas posibles
- Instrucciones paso a paso para reset
- CRUD completo para administradores

### 🛠️ Tecnologías

**Backend:**
- Node.js + Express
- PostgreSQL
- JWT Authentication
- Bcrypt
- Multer (upload de imágenes)

**Frontend:**
- React 18
- Vite
- Tailwind CSS
- React Router
- Axios

## 🚀 Instalación

### Prerrequisitos

```bash
- Node.js >= 16.0.0
- PostgreSQL >= 12
- npm >= 8.0.0
```

### 1. Clonar el Repositorio

```bash
git clone <repository-url>
cd equipment-manager
```

### 2. Configurar Base de Datos

**Crear la base de datos:**

```bash
psql -U postgres
CREATE DATABASE equipment_manager;
\q
```

**Ejecutar el schema:**

```bash
psql -U postgres -d equipment_manager -f database/schema.sql
```

### 3. Configurar Backend

```bash
cd backend
npm install
```

**Configurar variables de entorno:**

```bash
cp .env.example .env
# Editar .env con tus credenciales
```

**Variables importantes en `.env`:**
```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=equipment_manager
DB_USER=postgres
DB_PASSWORD=tu_contraseña
JWT_SECRET=cambiar_en_produccion
ADMIN_PASSWORD=Admin@2024
```

**Inicializar usuario administrador:**

```bash
npm run init-db
```

**Iniciar servidor backend:**

```bash
npm run dev  # Desarrollo
npm start    # Producción
```

El backend estará disponible en `http://localhost:5000`

### 4. Configurar Frontend

```bash
cd ../frontend
npm install
```

**Crear archivo `.env.local`:**

```bash
echo "VITE_API_URL=http://localhost:5000/api" > .env.local
```

**Iniciar servidor frontend:**

```bash
npm run dev
```

El frontend estará disponible en `http://localhost:5173`

## 🎯 Uso

### Acceso Inicial

**Credenciales por defecto:**
- Usuario: `admin`
- Contraseña: `Admin@2024`

⚠️ **IMPORTANTE**: Cambiar la contraseña por defecto en producción

### Usuario Administrador

**Puede realizar:**
- Crear, editar y eliminar usuarios
- Activar/desactivar usuarios
- Crear, editar y eliminar marcas
- Crear, editar y eliminar modelos
- Subir y gestionar imágenes
- Ver logs de actividad

### Usuario Normal

**Puede realizar:**
- Consultar marcas y modelos
- Ver imágenes de equipos
- Ver contraseñas posibles
- Ver instrucciones de reset
- Buscar modelos

## 📁 Estructura del Proyecto

```
equipment-manager/
├── backend/
│   ├── config/
│   │   └── database.js          # Configuración PostgreSQL
│   ├── controllers/
│   │   ├── authController.js    # Autenticación
│   │   ├── usersController.js   # Gestión usuarios
│   │   ├── brandsController.js  # Gestión marcas
│   │   ├── modelsController.js  # Gestión modelos
│   │   └── uploadController.js  # Subida imágenes
│   ├── middleware/
│   │   ├── auth.js              # Autenticación JWT
│   │   └── upload.js            # Multer config
│   ├── routes/
│   │   └── index.js             # Rutas principales
│   ├── scripts/
│   │   └── initDatabase.js      # Script inicialización
│   ├── uploads/                 # Imágenes subidas
│   ├── .env.example             # Variables de entorno
│   ├── package.json
│   └── server.js                # Servidor principal
│
├── frontend/
│   ├── src/
│   │   ├── components/          # Componentes reutilizables
│   │   ├── contexts/
│   │   │   └── AuthContext.jsx  # Contexto autenticación
│   │   ├── pages/
│   │   │   ├── Login.jsx        # Página login
│   │   │   └── Dashboard.jsx    # Dashboard principal
│   │   ├── services/
│   │   │   └── api.js           # Servicio API centralizado
│   │   ├── App.jsx              # Componente principal
│   │   ├── main.jsx             # Entry point
│   │   └── index.css            # Estilos Tailwind
│   ├── index.html
│   ├── package.json
│   ├── vite.config.js
│   └── tailwind.config.js
│
└── database/
    └── schema.sql               # Schema PostgreSQL
```

## 🔌 API Endpoints

### Autenticación
```
POST   /api/auth/login          # Login
GET    /api/auth/verify         # Verificar token
POST   /api/auth/logout         # Logout
```

### Usuarios (Solo Admin)
```
GET    /api/users               # Listar usuarios
GET    /api/users/:id           # Obtener usuario
POST   /api/users               # Crear usuario
PUT    /api/users/:id           # Actualizar usuario
DELETE /api/users/:id           # Eliminar usuario
```

### Marcas
```
GET    /api/brands              # Listar marcas
GET    /api/brands/:id          # Obtener marca
GET    /api/brands/:id/models   # Modelos de marca
POST   /api/brands              # Crear marca (Admin)
PUT    /api/brands/:id          # Actualizar marca (Admin)
DELETE /api/brands/:id          # Eliminar marca (Admin)
```

### Modelos
```
GET    /api/models              # Listar modelos
GET    /api/models/search       # Buscar modelos
GET    /api/models/:id          # Obtener modelo
POST   /api/models              # Crear modelo (Admin)
PUT    /api/models/:id          # Actualizar modelo (Admin)
DELETE /api/models/:id          # Eliminar modelo (Admin)
```

### Upload (Solo Admin)
```
POST   /api/upload              # Subir imagen
GET    /api/upload              # Listar imágenes
DELETE /api/upload/:filename    # Eliminar imagen
```

## 🔒 Seguridad

### Implementaciones de Seguridad

✅ Contraseñas hasheadas con bcrypt (10 rounds)
✅ Autenticación JWT con tokens expirados
✅ Protección de rutas por rol
✅ Validación de inputs
✅ Rate limiting (100 req/15min)
✅ CORS configurado
✅ Helmet para headers HTTP seguros
✅ SQL injection prevention (prepared statements)
✅ XSS protection
✅ CSRF tokens (en sesiones)

### Recomendaciones para Producción

1. **Cambiar JWT_SECRET** a un valor aleatorio fuerte
2. **Usar HTTPS** en producción
3. **Configurar firewall** del servidor
4. **Habilitar backups** automáticos de BD
5. **Actualizar dependencias** regularmente
6. **Monitorear logs** de actividad
7. **Implementar 2FA** para admin (opcional)
8. **Usar variables de entorno** seguras

## 📊 Base de Datos

### Tablas Principales

**users**: Usuarios del sistema
- id, username, password_hash, role, active

**brands**: Marcas de equipos
- id, name

**models**: Modelos de equipos
- id, brand_id, name, image_url, reset_instructions, possible_passwords

**activity_logs**: Logs de actividad
- id, user_id, action, details, ip_address, created_at

## 🐛 Troubleshooting

### Error de conexión a PostgreSQL

```bash
# Verificar que PostgreSQL está corriendo
sudo systemctl status postgresql

# Verificar credenciales en .env
psql -U postgres -d equipment_manager
```

### Error de permisos en uploads/

```bash
cd backend
mkdir uploads
chmod 755 uploads
```

### Puerto ya en uso

```bash
# Backend (cambiar en .env)
PORT=5001

# Frontend (cambiar en vite.config.js)
server: { port: 5174 }
```

## 📝 Scripts Disponibles

### Backend
```bash
npm start          # Iniciar servidor producción
npm run dev        # Iniciar con nodemon (desarrollo)
npm run init-db    # Inicializar base de datos
```

### Frontend
```bash
npm run dev        # Servidor desarrollo
npm run build      # Build producción
npm run preview    # Preview build
```

## 🚀 Despliegue en Producción

### Opción 1: VPS/Servidor Dedicado

1. Configurar servidor con Node.js y PostgreSQL
2. Clonar repositorio
3. Configurar variables de entorno
4. Build del frontend: `npm run build`
5. Usar PM2 para el backend: `pm2 start server.js`
6. Configurar Nginx como reverse proxy
7. Certificado SSL con Let's Encrypt

### Opción 2: Cloud (Render, Railway, etc.)

1. Conectar repositorio
2. Configurar variables de entorno
3. Deploy automático

## 📄 Licencia

MIT License - Ver LICENSE file

## 👥 Soporte

Para reportar bugs o solicitar features, abrir un issue en el repositorio.

---

**Desarrollado con ❤️ para gestión eficiente de equipos**
