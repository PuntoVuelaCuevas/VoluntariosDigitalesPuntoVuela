const bcrypt = require('bcrypt');
const { Usuario } = require('../models');

// Registrar nuevo usuario
exports.register = async (req, res) => {
    try {
        const { nombre_completo, email, password, edad, genero } = req.body;

        // Validar campos requeridos
        if (!nombre_completo || !email || !password) {
            return res.status(400).json({
                message: 'Nombre, email y contraseña son requeridos'
            });
        }

        // Verificar si el email ya existe
        const existingUser = await Usuario.findOne({ where: { email } });
        if (existingUser) {
            return res.status(400).json({
                message: 'El email ya está registrado'
            });
        }

        // Generar nombre de usuario único
        const nombre_usuario = email.split('@')[0] + '_' + Date.now();

        // Hash de la contraseña
        const password_hash = await bcrypt.hash(password, 10);

        // Crear usuario
        const usuario = await Usuario.create({
            nombre_usuario,
            email,
            password_hash,
            nombre_completo,
            edad: edad || null,
            genero: genero || null,
            es_voluntario: false,
            rol_activo: null
        });

        // Responder sin enviar el password_hash
        res.status(201).json({
            id: usuario.id,
            nombre_usuario: usuario.nombre_usuario,
            email: usuario.email,
            nombre_completo: usuario.nombre_completo,
            edad: usuario.edad,
            genero: usuario.genero,
            rol_activo: usuario.rol_activo
        });
    } catch (error) {
        console.error('Error in register:', error);
        res.status(500).json({
            message: 'Error al registrar usuario',
            error: error.message
        });
    }
};

// Login
exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Validar campos
        if (!email || !password) {
            return res.status(400).json({
                message: 'Email y contraseña son requeridos'
            });
        }

        // Buscar usuario
        const usuario = await Usuario.findOne({ where: { email } });
        if (!usuario) {
            return res.status(401).json({
                message: 'Email o contraseña incorrectos'
            });
        }

        // Verificar contraseña
        const isValidPassword = await bcrypt.compare(password, usuario.password_hash);
        if (!isValidPassword) {
            return res.status(401).json({
                message: 'Email o contraseña incorrectos'
            });
        }

        // Responder con datos del usuario (sin password_hash)
        res.json({
            id: usuario.id,
            nombre_usuario: usuario.nombre_usuario,
            email: usuario.email,
            nombre_completo: usuario.nombre_completo,
            edad: usuario.edad,
            genero: usuario.genero,
            rol_activo: usuario.rol_activo,
            es_voluntario: usuario.es_voluntario
        });
    } catch (error) {
        console.error('Error in login:', error);
        res.status(500).json({
            message: 'Error al iniciar sesión',
            error: error.message
        });
    }
};
