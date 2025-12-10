-- ----------------------------------------------------------------------
-- SQL SCRIPT: ESQUEMA COMPLETO PARA VOLUNTARIOS-APP
-- Destino: MySQL (Aiven.io)
-- ----------------------------------------------------------------------

-- 1. CREAR LA BASE DE DATOS
CREATE DATABASE IF NOT EXISTS `Voluntarios-App`
DEFAULT CHARACTER SET utf8mb4
COLLATE utf8mb4_unicode_ci;

-- 2. USAR LA BASE DE DATOS
USE `Voluntarios-App`;

-- 3. ELIMINACIÓN DE TABLAS (para permitir la ejecución repetida sin errores)
DROP TABLE IF EXISTS `mensajes`;
DROP TABLE IF EXISTS `trayectos_solicitados`;
DROP TABLE IF EXISTS `usuario`;

-- 4. TABLA: USUARIO
CREATE TABLE `usuario` (
    `id` INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
    `nombre_usuario` VARCHAR(50) NOT NULL UNIQUE COMMENT 'Username único del sistema',
    `email` VARCHAR(100) NOT NULL UNIQUE COMMENT 'Email único del usuario',
    `password_hash` VARCHAR(255) NOT NULL COMMENT 'Contraseña cifrada (nunca almacenar en texto plano)',
    `nombre_completo` VARCHAR(100) NULL COMMENT 'Nombre completo del usuario',
    `es_voluntario` BOOLEAN NOT NULL DEFAULT FALSE COMMENT 'Indica si el usuario quiere ser visible para aceptar tareas',
    `telefono` VARCHAR(20) NULL COMMENT 'Teléfono de contacto',
    `fecha_registro` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Fecha de registro en el sistema'
) COMMENT 'Usuarios de la aplicación (solicitantes y voluntarios)';

-- 5. TABLA: TRAYECTOS_SOLICITADOS
CREATE TABLE `trayectos_solicitados` (
    `id` INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
    
    -- Clave Foránea: El usuario que solicita la ayuda
    `solicitante_id` INT UNSIGNED NOT NULL,
    
    `titulo` VARCHAR(100) NOT NULL COMMENT 'Título o categoría de la solicitud',
    `descripcion` TEXT NOT NULL COMMENT 'Descripción detallada de la ayuda necesaria',
    `ubicacion_origen` VARCHAR(255) NOT NULL COMMENT 'Ubicación donde se necesita la ayuda',
    `ubicacion_destino` VARCHAR(255) NOT NULL COMMENT 'Ubicación de destino (si aplica)',
    `fecha_necesaria` DATETIME NOT NULL COMMENT 'Fecha y hora en la que se requiere la ayuda',
    
    -- Estado de la solicitud
    `estado` ENUM('PENDIENTE', 'ACEPTADO', 'COMPLETADO', 'CANCELADO') NOT NULL DEFAULT 'PENDIENTE' COMMENT 'Estado actual de la solicitud',
    
    -- Clave Foránea: El usuario que acepta ser voluntario (NULL si PENDIENTE)
    `voluntario_id` INT UNSIGNED NULL DEFAULT NULL,
    
    `fecha_creacion` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Fecha de creación de la solicitud',
    
    -- Definición de Claves Foráneas
    FOREIGN KEY (`solicitante_id`) REFERENCES `usuario`(`id`) ON DELETE CASCADE,
    FOREIGN KEY (`voluntario_id`) REFERENCES `usuario`(`id`) ON DELETE SET NULL,
    
    -- Índices para mejorar el rendimiento
    INDEX `idx_estado` (`estado`),
    INDEX `idx_fecha_necesaria` (`fecha_necesaria`),
    INDEX `idx_solicitante` (`solicitante_id`),
    INDEX `idx_voluntario` (`voluntario_id`)
) COMMENT 'Peticiones de ayuda subidas por los usuarios';

-- 6. TABLA: MENSAJES
CREATE TABLE `mensajes` (
    `id` INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
    
    -- Clave Foránea: El trayecto específico al que pertenece el mensaje
    `trayecto_id` INT UNSIGNED NOT NULL,
    
    -- Clave Foránea: El usuario que envió el mensaje
    `emisor_id` INT UNSIGNED NOT NULL,
    
    `contenido` TEXT NOT NULL COMMENT 'Contenido del mensaje',
    `fecha_envio` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Fecha y hora de envío del mensaje',
    
    -- Definición de Claves Foráneas
    FOREIGN KEY (`trayecto_id`) REFERENCES `trayectos_solicitados`(`id`) ON DELETE CASCADE,
    FOREIGN KEY (`emisor_id`) REFERENCES `usuario`(`id`) ON DELETE CASCADE,
    
    -- Índices
    INDEX `idx_trayecto` (`trayecto_id`),
    INDEX `idx_fecha` (`fecha_envio`)
) COMMENT 'Mensajes de coordinación entre solicitante y voluntario';

-- ----------------------------------------------------------------------
-- 7. INSERCIÓN DE DATOS DE EJEMPLO (OPCIONAL)
-- ----------------------------------------------------------------------

-- Usuarios de ejemplo
INSERT INTO `usuario` 
    (`nombre_usuario`, `email`, `password_hash`, `nombre_completo`, `es_voluntario`, `telefono`) 
VALUES
    ('maria_s_1234567890', 'maria_s_1234567890@voluntarios.app', '$2b$10$hash1hash1hash1hash1hash1hash1', 'Maria Solis', FALSE, '555123456'),
    ('javier_v_1234567891', 'javier_v_1234567891@voluntarios.app', '$2b$10$hash2hash2hash2hash2hash2hash2', 'Javier Valdés', TRUE, '555987654'),
    ('elena_s_1234567892', 'elena_s_1234567892@voluntarios.app', '$2b$10$hash3hash3hash3hash3hash3hash3', 'Elena Gómez', FALSE, '555111222'),
    ('ricardo_v_1234567893', 'ricardo_v_1234567893@voluntarios.app', '$2b$10$hash4hash4hash4hash4hash4hash4', 'Ricardo Torres', TRUE, '555333444');

-- Trayectos Solicitados de ejemplo
INSERT INTO `trayectos_solicitados` 
    (`solicitante_id`, `titulo`, `descripcion`, `ubicacion_origen`, `ubicacion_destino`, `fecha_necesaria`, `estado`, `voluntario_id`) 
VALUES
    -- Trayecto PENDIENTE
    (1, 'whatsapp', 'Necesito ayuda para configurar WhatsApp en mi nuevo teléfono', '{"id":"loc1","name":"Punto Vuela","lat":36.87617075381733,"lng":-5.045460278303508,"icon":"🏢","color":"blue"}', '', '2026-01-10 16:00:00', 'PENDIENTE', NULL),
    
    -- Trayecto ACEPTADO
    (3, 'apps', 'Necesito instalar y configurar aplicaciones bancarias', '{"id":"loc2","name":"Rafael Alberti","lat":36.87199299684786,"lng":-5.045088258193824,"icon":"🏥","color":"red"}', '', '2026-01-05 09:30:00', 'ACEPTADO', 2),
    
    -- Trayecto COMPLETADO
    (1, 'social', 'Ayuda con Instagram y Facebook', '{"id":"loc3","name":"Nacimiento","lat":37.267813332388805,"lng":-4.414889758193826,"icon":"🏛️","color":"green"}', '', '2025-12-05 18:00:00', 'COMPLETADO', 4);

-- Mensajes de ejemplo (solo para el Trayecto 2 - ACEPTADO)
INSERT INTO `mensajes` 
    (`trayecto_id`, `emisor_id`, `contenido`, `fecha_envio`) 
VALUES
    (2, 2, 'Hola Elena, he aceptado tu solicitud. ¿Cuándo te viene mejor que nos veamos?', '2025-12-04 10:00:00'),
    (2, 3, 'Hola Javier, muchas gracias. ¿Te viene bien mañana a las 10:00?', '2025-12-04 10:05:00'),
    (2, 2, 'Perfecto, nos vemos mañana. ¡Hasta entonces!', '2025-12-04 10:10:00');

-- ----------------------------------------------------------------------
-- 8. VERIFICACIÓN DE LA ESTRUCTURA
-- ----------------------------------------------------------------------

-- Mostrar todas las tablas creadas
SHOW TABLES;

-- Verificar estructura de cada tabla
DESCRIBE `usuario`;
DESCRIBE `trayectos_solicitados`;
DESCRIBE `mensajes`;

-- Contar registros en cada tabla
SELECT 'Usuarios' as Tabla, COUNT(*) as Total FROM `usuario`
UNION ALL
SELECT 'Trayectos', COUNT(*) FROM `trayectos_solicitados`
UNION ALL
SELECT 'Mensajes', COUNT(*) FROM `mensajes`;
