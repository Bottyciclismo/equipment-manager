# 🚀 Guía de Inicio Rápido - Equipment Manager

## ⚡ Setup en 5 Minutos

### 1. Crear Base de Datos (1 min)

```bash
# Abrir PostgreSQL
psql -U postgres

# Crear BD
CREATE DATABASE equipment_manager;

# Salir
\q

# Importar schema
psql -U postgres -d equipment_manager -f database/schema.sql
```

### 2. Configurar Backend (2 min)

```bash
cd backend

# Instalar dependencias
npm install

# Crear archivo .env
cat > .env << EOF
NODE_ENV=development
PORT=5000
DB_HOST=localhost
DB_PORT=5432
DB_NAME=equipment_manager
DB_USER=postgres
DB_PASSWORD=TU_CONTRASEÑA_AQUI
JWT_SECRET=$(openssl rand -base64 32)
JWT_EXPIRES_IN=24h
CORS_ORIGIN=http://localhost:5173
ADMIN_USERNAME=admin
ADMIN_PASSWORD=Admin@2024
EOF

# Crear admin
npm run init-db

# Iniciar servidor
npm run dev
```

### 3. Configurar Frontend (2 min)

```bash
# En otra terminal
cd frontend

# Instalar dependencias
npm install

# Crear .env
echo "VITE_API_URL=http://localhost:5000/api" > .env.local

# Iniciar
npm run dev
```

## ✅ Verificación

1. Backend: http://localhost:5000/api/health
2. Frontend: http://localhost:5173
3. Login con: `admin` / `Admin@2024`

## 📝 Datos de Prueba

El schema incluye datos de ejemplo:
- 5 marcas (Cisco, HP, Dell, Ubiquiti, MikroTik)
- 3 modelos con instrucciones completas

## 🎯 Primeros Pasos

1. Login como admin
2. Explorar marcas y modelos
3. Buscar un equipo
4. Ver instrucciones de reset

## 🔄 Reiniciar Sistema

```bash
# Limpiar y reiniciar BD
psql -U postgres -d equipment_manager -f database/schema.sql

# Reiniciar admin
cd backend
npm run init-db
```

## ⚠️ Problemas Comunes

**Puerto ocupado:**
```bash
# Ver proceso usando el puerto
lsof -i :5000
# Cambiar puerto en backend/.env
```

**Error de conexión BD:**
```bash
# Verificar PostgreSQL
sudo systemctl status postgresql
# Verificar credenciales en .env
```

**Módulos faltantes:**
```bash
cd backend && npm install
cd frontend && npm install
```

## 📦 Build para Producción

```bash
# Frontend
cd frontend
npm run build
# Archivos en: dist/

# Backend
cd backend
# Cambiar .env a production
NODE_ENV=production
# Usar PM2
pm2 start server.js --name equipment-manager
```

---

¡Todo listo! 🎉 Sistema funcionando en < 5 minutos
