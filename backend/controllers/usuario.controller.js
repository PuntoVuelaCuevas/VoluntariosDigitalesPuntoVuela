const { Usuario } = require('../models');

exports.createUsuario = async (req, res) => {
    try {
        console.log('Creating user with data:', req.body);
        const usuario = await Usuario.create(req.body);
        console.log('User created successfully:', usuario.id);
        res.status(201).json(usuario);
    } catch (error) {
        console.error('ERROR CREATING USER - Full error:');
        console.error('Message:', error.message);
        console.error('Name:', error.name);
        if (error.errors) {
            console.error('Validation errors:', error.errors.map(e => ({
                field: e.path,
                message: e.message,
                type: e.type
            })));
        }
        console.error('Stack:', error.stack);
        res.status(500).json({
            message: 'Error creating user',
            error: error.message,
            details: error.errors ? error.errors.map(e => e.message) : []
        });
    }
};

// Actualizar rol del usuario
exports.updateRol = async (req, res) => {
    try {
        const { id } = req.params;
        const { rol } = req.body;

        if (!rol || !['voluntario', 'solicitante'].includes(rol)) {
            return res.status(400).json({
                message: 'Rol debe ser "voluntario" o "solicitante"'
            });
        }

        const usuario = await Usuario.findByPk(id);
        if (!usuario) {
            return res.status(404).json({ message: 'Usuario no encontrado' });
        }

        usuario.rol_activo = rol;
        usuario.es_voluntario = (rol === 'voluntario');
        await usuario.save();

        res.json({
            id: usuario.id,
            nombre_completo: usuario.nombre_completo,
            rol_activo: usuario.rol_activo,
            es_voluntario: usuario.es_voluntario
        });
    } catch (error) {
        console.error('Error updating rol:', error);
        res.status(500).json({
            message: 'Error al actualizar rol',
            error: error.message
        });
    }
};

exports.findAllUsuarios = async (req, res) => {
    try {
        const usuarios = await Usuario.findAll();
        res.status(200).json(usuarios);
    } catch (error) {
        res.status(500).json({ message: 'Error retrieving users', error: error.message });
    }
};

exports.findOneUsuario = async (req, res) => {
    try {
        const usuario = await Usuario.findByPk(req.params.id);
        if (usuario) res.status(200).json(usuario);
        else res.status(404).json({ message: 'User not found' });
    } catch (error) {
        res.status(500).json({ message: 'Error retrieving user', error: error.message });
    }
};
