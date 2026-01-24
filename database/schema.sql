-- =====================================================
-- EQUIPMENT MANAGER DATABASE SCHEMA
-- PostgreSQL 12+
-- =====================================================

-- Eliminar tablas si existen (para desarrollo)
DROP TABLE IF EXISTS models CASCADE;
DROP TABLE IF EXISTS brands CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS activity_logs CASCADE;

-- =====================================================
-- TABLA: users
-- =====================================================
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(10) NOT NULL CHECK (role IN ('admin', 'user')),
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Índices para optimizar búsquedas
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_active ON users(active);

-- =====================================================
-- TABLA: brands
-- =====================================================
CREATE TABLE brands (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_brands_name ON brands(name);

-- =====================================================
-- TABLA: models
-- =====================================================
CREATE TABLE models (
    id SERIAL PRIMARY KEY,
    brand_id INTEGER NOT NULL REFERENCES brands(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    image_url VARCHAR(500),
    reset_instructions TEXT,
    possible_passwords TEXT, -- Almacenado como JSON string
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(brand_id, name)
);

CREATE INDEX idx_models_brand_id ON models(brand_id);
CREATE INDEX idx_models_name ON models(name);

-- =====================================================
-- TABLA: activity_logs (Extra opcional)
-- =====================================================
CREATE TABLE activity_logs (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    action VARCHAR(100) NOT NULL,
    details TEXT,
    ip_address VARCHAR(45),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_activity_logs_user_id ON activity_logs(user_id);
CREATE INDEX idx_activity_logs_created_at ON activity_logs(created_at);

-- =====================================================
-- TRIGGERS PARA UPDATED_AT
-- =====================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_brands_updated_at BEFORE UPDATE ON brands
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_models_updated_at BEFORE UPDATE ON models
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- CONSTRAINT: Solo un administrador
-- =====================================================
CREATE OR REPLACE FUNCTION check_single_admin()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.role = 'admin' THEN
        IF EXISTS (SELECT 1 FROM users WHERE role = 'admin' AND id != NEW.id) THEN
            RAISE EXCEPTION 'Solo puede existir un administrador en el sistema';
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER enforce_single_admin
    BEFORE INSERT OR UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION check_single_admin();

-- =====================================================
-- DATOS INICIALES
-- =====================================================

-- Usuario administrador por defecto
-- Password: Admin@2024 (bcrypt hash)
INSERT INTO users (username, password_hash, role, active) VALUES
('admin', '$2b$10$YourHashWillBeGeneratedByBackend', 'admin', true);

-- Marcas de ejemplo
INSERT INTO brands (name) VALUES
('Cisco'),
('HP'),
('Dell'),
('Ubiquiti'),
('MikroTik');

-- Modelos de ejemplo
INSERT INTO models (brand_id, name, image_url, reset_instructions, possible_passwords) VALUES
(1, 'Catalyst 2960', '/uploads/cisco-2960.jpg', 
'1. Conectar cable de consola
2. Reiniciar el switch
3. Presionar el botón MODE durante el inicio
4. Ejecutar: flash_init
5. Ejecutar: load_helper
6. Ejecutar: rename flash:config.text flash:config.old
7. Ejecutar: boot
8. Responder NO a la configuración inicial
9. Entrar en modo privilegiado
10. Restaurar: rename flash:config.old flash:config.text
11. Ejecutar: copy flash:config.text system:running-config
12. Cambiar contraseña con: enable secret nueva_contraseña
13. Guardar: write memory',
'["cisco", "Cisco123", "admin", ""]'),

(2, 'ProCurve 2920', '/uploads/hp-2920.jpg',
'1. Conectar por consola
2. Reiniciar el switch
3. Presionar cualquier tecla durante el boot
4. Seleccionar opción: Boot Menu
5. Elegir: Password Recovery
6. El sistema borrará la contraseña
7. Configurar nueva contraseña
8. Guardar configuración',
'["admin", "password", ""]'),

(3, 'PowerConnect 5524', '/uploads/dell-5524.jpg',
'1. Conectar cable de consola
2. Iniciar el switch
3. Mantener presionado el botón RESET
4. Esperar mensaje de reset
5. Soltar botón
6. Sistema iniciará sin contraseña
7. Configurar nueva contraseña: username admin password nueva_pass
8. Guardar: copy running-config startup-config',
'["admin", "password", ""]');

-- Log de creación del sistema
INSERT INTO activity_logs (user_id, action, details) VALUES
(1, 'SYSTEM_INIT', 'Sistema inicializado con datos de ejemplo');

-- =====================================================
-- VISTAS ÚTILES
-- =====================================================

-- Vista de modelos con información de marca
CREATE VIEW models_with_brand AS
SELECT 
    m.id,
    m.name AS model_name,
    b.name AS brand_name,
    m.brand_id,
    m.image_url,
    m.reset_instructions,
    m.possible_passwords,
    m.created_at,
    m.updated_at
FROM models m
INNER JOIN brands b ON m.brand_id = b.id;

-- Vista de usuarios activos
CREATE VIEW active_users AS
SELECT 
    id,
    username,
    role,
    created_at
FROM users
WHERE active = true;

-- =====================================================
-- COMENTARIOS
-- =====================================================
COMMENT ON TABLE users IS 'Tabla de usuarios del sistema con roles admin/user';
COMMENT ON TABLE brands IS 'Marcas de equipos disponibles';
COMMENT ON TABLE models IS 'Modelos de equipos con información de reset';
COMMENT ON TABLE activity_logs IS 'Registro de actividades del sistema';

-- =====================================================
-- FIN DEL SCRIPT
-- =====================================================
