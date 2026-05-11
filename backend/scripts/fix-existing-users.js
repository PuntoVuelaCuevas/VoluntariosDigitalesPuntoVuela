// Script para actualizar usuarios existentes con el campo aprobado
// Ejecutar con: node fix-existing-users.js

const { sequelize } = require('../config/db');

async function fixExistingUsers() {
    try {
        console.log('Iniciando actualización de usuarios existentes...');

        // Actualizar todos los usuarios que tienen aprobado = NULL o undefined
        // y establecerlo en false
        const result = await sequelize.query(`
            UPDATE \`usuario\` 
            SET \`aprobado\` = FALSE 
            WHERE \`aprobado\` IS NULL
        `);

        const updatedCount = result[1] || 0;
        console.log(`✅ ${updatedCount} usuarios actualizados con aprobado = false`);

        // Verificar cuántos usuarios tenemos en total
        const [totalResult] = await sequelize.query(`
            SELECT COUNT(*) as total FROM \`usuario\`
        `, { raw: true });

        const total = totalResult[0]?.total || 0;
        console.log(`✅ Total de usuarios en BD: ${total}`);

        // Verificar cuántos están pendientes (con aprobado = false)
        const [pendingResult] = await sequelize.query(`
            SELECT COUNT(*) as pending FROM \`usuario\` WHERE aprobado = false
        `, { raw: true });

        const pending = pendingResult[0]?.pending || 0;
        console.log(`✅ Usuarios pendientes de aprobación: ${pending}`);

        // Verificar cuántos están aprobados
        const [approvedResult] = await sequelize.query(`
            SELECT COUNT(*) as approved FROM \`usuario\` WHERE aprobado = true
        `, { raw: true });

        const approved = approvedResult[0]?.approved || 0;
        console.log(`✅ Usuarios aprobados: ${approved}`);

    } catch (error) {
        console.error('❌ Error durante la actualización:', error.message);
        if (error.sql) {
            console.error('SQL:', error.sql);
        }
    } finally {
        await sequelize.close();
        process.exit(0);
    }
}

fixExistingUsers();
