// Script para agregar columnas faltantes a la tabla usuario
// Ejecutar con: node fix-db-schema.js

const { sequelize } = require('../config/db');

async function fixDBSchema() {
    try {
        console.log('Agregando columnas faltantes a tabla usuario...\n');

        // Agregar todas las columnas faltantes
        const columnsToAdd = [
            {
                name: 'edad',
                sql: 'ALTER TABLE `usuario` ADD `edad` INT COMMENT "Edad del usuario"'
            },
            {
                name: 'genero',
                sql: 'ALTER TABLE `usuario` ADD `genero` VARCHAR(20) COMMENT "Género del usuario"'
            },
            {
                name: 'localidad',
                sql: 'ALTER TABLE `usuario` ADD `localidad` VARCHAR(100) COMMENT "Localidad del usuario"'
            },
            {
                name: 'rol_activo',
                sql: "ALTER TABLE `usuario` ADD `rol_activo` ENUM('voluntario', 'solicitante') COMMENT 'Rol actual del usuario'"
            },
            {
                name: 'email_verified',
                sql: 'ALTER TABLE `usuario` ADD `email_verified` BOOLEAN DEFAULT FALSE'
            },
            {
                name: 'verification_token',
                sql: 'ALTER TABLE `usuario` ADD `verification_token` VARCHAR(255)'
            },
            {
                name: 'reset_password_token',
                sql: 'ALTER TABLE `usuario` ADD `reset_password_token` VARCHAR(255)'
            },
            {
                name: 'reset_password_expires',
                sql: 'ALTER TABLE `usuario` ADD `reset_password_expires` DATETIME'
            }
        ];

        for (const col of columnsToAdd) {
            try {
                await sequelize.query(col.sql);
                console.log(`✅ Columna ${col.name} agregada/verificada`);
            } catch (err) {
                console.log(`⚠️ Columna ${col.name}: ${err.message.substring(0, 100)}`);
            }
        }

        console.log('\n✅ Esquema actualizado correctamente');

        // Mostrar esquema final
        const [columns] = await sequelize.query('SHOW COLUMNS FROM `usuario`');
        console.log('\n=== Esquema final de usuario ===');
        columns.forEach(col => {
            console.log(`- ${col.Field} (${col.Type})`);
        });

    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        await sequelize.close();
        process.exit(0);
    }
}

fixDBSchema();
