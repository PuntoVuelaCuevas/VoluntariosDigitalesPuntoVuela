const bcrypt = require('bcrypt');

const password = process.argv[2];

if (!password) {
    console.log('Por favor proporciona una contraseña. Ejemplo: node generateHash.js "mi_contraseña"');
    process.exit(1);
}

const saltRounds = 10;

bcrypt.hash(password, saltRounds, function (err, hash) {
    if (err) {
        console.error('Error generando hash:', err);
        return;
    }
    console.log(`\nContraseña: ${password}`);
    console.log(`Hash (guardar esto en base de datos): ${hash}\n`);
    console.log(`INSERT SQL Ejemplo:`);
    console.log(`INSERT INTO usuario (nombre_usuario, email, password_hash, nombre_completo, rol_activo) VALUES ('usuario_prueba', 'correo@ejemplo.com', '${hash}', 'Nombre Prueba', 'solicitante');`);
});
