// Script para verificar el estado de la BD
// Ejecutar con: node check-db-schema.js

const { sequelize } = require('../config/db');

async function checkDBSchema() {
    try {
        console.log('Verificando esquema de BD...\n');

        // Mostrar estructura de tabla usuario
        const [columns] = await sequelize.query(`
            SHOW COLUMNS FROM \`usuario\`
        `);

        console.log('=== Columnas de tabla usuario ===');
        columns.forEach(col => {
            console.log(`- ${col.Field} (${col.Type}) ${col.Null === 'NO' ? 'NOT NULL' : 'NULLABLE'}`);
        });

        console.log('\n=== Listado de usuarios ===');
        const [users] = await sequelize.query(`
            SELECT id, nombre_completo, email, email_verified, aprobado FROM \`usuario\` LIMIT 5
        `, { raw: true });

        users.forEach(u => {
            console.log(`ID: ${u.id}, Nombre: ${u.nombre_completo}, Email: ${u.email}, Verified: ${u.email_verified}, Aprobado: ${u.aprobado}`);
        });

    } catch (error) {
        console.error('❌ Error:', error.message);
        if (error.sql) {
            console.error('SQL:', error.sql);
        }
    } finally {
        await sequelize.close();
        process.exit(0);
    }
}

checkDBSchema();
