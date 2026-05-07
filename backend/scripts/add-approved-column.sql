-- Script para agregar columna 'aprobado' a la tabla 'usuario'
-- Este script es seguro y no perderá datos existentes

-- Verificar si la columna ya existe
ALTER TABLE `usuario` 
ADD COLUMN IF NOT EXISTS `aprobado` BOOLEAN NOT NULL DEFAULT FALSE 
COMMENT 'Si el usuario ha sido aprobado por el admin';

-- Crear índice para búsquedas por estado de aprobación
CREATE INDEX IF NOT EXISTS `idx_aprobado` ON `usuario`(`aprobado`);

-- Verificar que la columna se agregó correctamente
-- SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'usuario' AND COLUMN_NAME = 'aprobado';
