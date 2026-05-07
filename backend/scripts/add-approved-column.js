// Script para agregar la columna 'aprobado' a la tabla 'usuario'
// Ejecutar con: node add-approved-column.js

const path = require('path');
const fs = require('fs');

// Cargar configuración de BD
const { sequelize } = require('../config/db');

async function addApprovedColumn() {
    try {
        console.log('Iniciando migración: agregar columna aprobado a tabla usuario...');

        // Verificar si la columna ya existe
        const result = await sequelize.query(`
            SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_NAME = 'usuario' AND COLUMN_NAME = 'aprobado'
        `);

        if (result[0].length > 0) {
            console.log('✅ La columna aprobado ya existe');
            await sequelize.close();
            process.exit(0);
        }

        // Ejecutar el SQL para agregar la columna
        await sequelize.query(`
            ALTER TABLE \`usuario\` 
            ADD COLUMN \`aprobado\` BOOLEAN NOT NULL DEFAULT FALSE 
            COMMENT 'Si el usuario ha sido aprobado por el admin'
        `);

        console.log('✅ Columna aprobado agregada correctamente');

        // Crear índice
        await sequelize.query(`
            CREATE INDEX \`idx_aprobado\` ON \`usuario\`(\`aprobado\`)
        `);

        console.log('✅ Índice creado correctamente');

        // Verificar que la columna existe
        const verifyResult = await sequelize.query(`
            SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_NAME = 'usuario' AND COLUMN_NAME = 'aprobado'
        `);

        if (verifyResult[0].length > 0) {
            console.log('✅ Migración completada exitosamente');
        } else {
            console.log('⚠️ Advertencia: La columna no se encontró después de la migración');
        }

    } catch (error) {
        console.error('❌ Error durante la migración:', error.message);
        if (error.sql) {
            console.error('SQL:', error.sql);
        }
    } finally {
        // Cerrar conexión
        await sequelize.close();
        process.exit(0);
    }
}

// Ejecutar
addApprovedColumn();
