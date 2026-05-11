// Script para agregar las columnas faltantes: edad, genero, localidad
// Ejecutar con: node add-missing-columns.js

const { sequelize } = require('../config/db');

async function addMissingColumns() {
    try {
        console.log('Agregando columnas faltantes...\n');

        const columns = [
            { name: 'edad', sql: 'ALTER TABLE usuario ADD edad INT' },
            { name: 'genero', sql: 'ALTER TABLE usuario ADD genero VARCHAR(20)' },
            { name: 'localidad', sql: 'ALTER TABLE usuario ADD localidad VARCHAR(100)' }
        ];

        for (const col of columns) {
            try {
                await sequelize.query(col.sql);
                console.log(`✅ Columna ${col.name} agregada`);
            } catch (err) {
                if (err.message.includes('Duplicate column')) {
                    console.log(`⚠️ Columna ${col.name} ya existe`);
                } else {
                    console.error(`❌ Error en ${col.name}: ${err.message}`);
                }
            }
        }

        // Verificar esquema final
        const [columns2] = await sequelize.query('SHOW COLUMNS FROM usuario');
        console.log('\n=== Esquema final ===');
        columns2.forEach(c => console.log(`- ${c.Field} (${c.Type})`));

    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        await sequelize.close();
        process.exit(0);
    }
}

addMissingColumns();
