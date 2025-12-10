-- ============================================
-- Script SQL para crear todas las tablas del proyecto
-- Voluntarios-App (Punto Vuela)
-- ============================================

-- Eliminar tablas si existen (opcional, comentar si no deseas eliminar datos)
-- DROP TABLE IF EXISTS mensaje;
-- DROP TABLE IF EXISTS trayecto;
-- DROP TABLE IF EXISTS usuario;

-- ============================================
-- Tabla: usuario
-- ============================================
CREATE TABLE IF NOT EXISTS `usuario` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `nombre_usuario` VARCHAR(50) NOT NULL UNIQUE,
  `email` VARCHAR(100) NOT NULL UNIQUE,
  `password_hash` VARCHAR(255) NOT NULL COMMENT 'Contraseña cifrada con bcrypt',
  `nombre_completo` VARCHAR(100) DEFAULT NULL,
  `es_voluntario` BOOLEAN NOT NULL DEFAULT FALSE,
  `telefono` VARCHAR(20) DEFAULT NULL,
  `edad` INT DEFAULT NULL COMMENT 'Edad del usuario',
  `genero` VARCHAR(20) DEFAULT NULL COMMENT 'Género del usuario',
  `rol_activo` ENUM('voluntario', 'solicitante') DEFAULT NULL COMMENT 'Rol actual del usuario',
  `fecha_registro` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  
  INDEX `idx_email` (`email`),
  INDEX `idx_rol_activo` (`rol_activo`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- Tabla: trayecto
-- ============================================
CREATE TABLE IF NOT EXISTS `trayecto` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `solicitante_id` INT UNSIGNED NOT NULL,
  `voluntario_id` INT UNSIGNED DEFAULT NULL,
  `titulo` VARCHAR(255) NOT NULL,
  `descripcion` TEXT DEFAULT NULL,
  `ubicacion_origen` TEXT DEFAULT NULL COMMENT 'JSON con datos de ubicación',
  `ubicacion_destino` TEXT DEFAULT NULL COMMENT 'JSON con datos de ubicación',
  `fecha_necesaria` DATETIME NOT NULL,
  `estado` ENUM('PENDIENTE', 'ACEPTADO', 'COMPLETADO', 'CANCELADO') NOT NULL DEFAULT 'PENDIENTE',
  `fecha_creacion` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `fecha_actualizacion` DATETIME DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
  
  FOREIGN KEY (`solicitante_id`) REFERENCES `usuario`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`voluntario_id`) REFERENCES `usuario`(`id`) ON DELETE SET NULL,
  
  INDEX `idx_solicitante` (`solicitante_id`),
  INDEX `idx_voluntario` (`voluntario_id`),
  INDEX `idx_estado` (`estado`),
  INDEX `idx_fecha_creacion` (`fecha_creacion`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- Tabla: mensaje
-- ============================================
CREATE TABLE IF NOT EXISTS `mensaje` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `trayecto_id` INT UNSIGNED NOT NULL,
  `emisor_id` INT UNSIGNED NOT NULL,
  `contenido` TEXT NOT NULL,
  `fecha_envio` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (`trayecto_id`) REFERENCES `trayecto`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`emisor_id`) REFERENCES `usuario`(`id`) ON DELETE CASCADE,
  
  INDEX `idx_trayecto` (`trayecto_id`),
  INDEX `idx_emisor` (`emisor_id`),
  INDEX `idx_fecha_envio` (`fecha_envio`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- Datos de ejemplo (CON CONTRASEÑAS REALES)
-- ============================================

-- IMPORTANTE: Las contraseñas NO se guardan en texto plano. Se guardan "hasheadas" (cifradas).
-- Para insertar usuarios manualmente, necesitas generar el hash de la contraseña.
-- Hemos creado un script para esto en: backend/generateHash.js
-- Uso: node generateHash.js "tu_contraseña"

-- A continuación, ejemplos con la contraseña: "123456"
-- El hash generado para "123456" es: $2b$10$vI8aWBnW3fID.ZQ4/zo1G.q1lRps.9cGLcZEiGDMVr5yUP1nERbKd

-- 1. Usuario Solicitante (Maria) - Contraseña: "123456"
INSERT INTO `usuario` 
(`nombre_usuario`, `email`, `password_hash`, `nombre_completo`, `es_voluntario`, `edad`, `genero`, `rol_activo`) 
VALUES 
('maria_garcia', 'maria@ejemplo.com', '$2b$10$vI8aWBnW3fID.ZQ4/zo1G.q1lRps.9cGLcZEiGDMVr5yUP1nERbKd', 'María García', FALSE, 45, 'Mujer', 'solicitante');

-- 2. Usuario Voluntario (Juan) - Contraseña: "123456"
INSERT INTO `usuario` 
(`nombre_usuario`, `email`, `password_hash`, `nombre_completo`, `es_voluntario`, `edad`, `genero`, `rol_activo`) 
VALUES 
('juan_perez', 'juan@ejemplo.com', '$2b$10$vI8aWBnW3fID.ZQ4/zo1G.q1lRps.9cGLcZEiGDMVr5yUP1nERbKd', 'Juan Pérez', TRUE, 28, 'Hombre', 'voluntario');


-- ============================================
-- Verificar tablas creadas
-- ============================================
-- SHOW TABLES;
-- DESCRIBE usuario;
-- DESCRIBE trayecto;
-- DESCRIBE mensaje;

-- ============================================
-- Información adicional
-- ============================================
-- Este script crea:
-- 1. Tabla 'usuario' con autenticación (email + password_hash)
-- 2. Tabla 'trayecto' para solicitudes de ayuda
-- 3. Tabla 'mensaje' para comunicación entre usuarios
--
-- Características de seguridad:
-- - Contraseñas cifradas con bcrypt (password_hash)
-- - Email único por usuario
-- - Relaciones con CASCADE para integridad referencial
-- - Índices para optimizar consultas
--
-- Encoding: UTF8MB4 para soporte completo de caracteres
-- Engine: InnoDB para transacciones y foreign keys
