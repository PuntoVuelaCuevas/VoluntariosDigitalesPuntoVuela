const { Trayecto, Usuario } = require('../models');

exports.createTrayecto = async (req, res) => {
    try {
        console.log('Creating trayecto with data:', req.body);
        const trayecto = await Trayecto.create(req.body);
        console.log('Trayecto created successfully:', trayecto.id);
        res.status(201).json(trayecto);
    } catch (error) {
        console.error('ERROR CREATING TRAYECTO - Full error:');
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
            message: 'Error creating journey',
            error: error.message,
            details: error.errors ? error.errors.map(e => e.message) : []
        });
    }
};

exports.findAllTrayectos = async (req, res) => {
    try {
        const trayectos = await Trayecto.findAll({
            include: [
                { model: Usuario, as: 'solicitante', attributes: ['nombre_usuario', 'nombre_completo', 'edad', 'genero'] },
                { model: Usuario, as: 'voluntario', attributes: ['nombre_usuario', 'nombre_completo'] }
            ]
        });
        res.status(200).json(trayectos);
    } catch (error) {
        res.status(500).json({ message: 'Error retrieving journeys', error: error.message });
    }
};

exports.findOneTrayecto = async (req, res) => {
    try {
        const trayecto = await Trayecto.findByPk(req.params.id, {
            include: [
                { model: Usuario, as: 'solicitante', attributes: ['nombre_usuario', 'nombre_completo'] },
                { model: Usuario, as: 'voluntario', attributes: ['nombre_usuario', 'nombre_completo'] }
            ]
        });
        if (trayecto) res.status(200).json(trayecto);
        else res.status(404).json({ message: 'Journey not found' });
    } catch (error) {
        res.status(500).json({ message: 'Error retrieving journey', error: error.message });
    }
};

exports.updateTrayecto = async (req, res) => {
    try {
        const [updated] = await Trayecto.update(req.body, {
            where: { id: req.params.id }
        });
        if (updated) {
            const updatedTrayecto = await Trayecto.findByPk(req.params.id, {
                include: [
                    { model: Usuario, as: 'solicitante', attributes: ['nombre_usuario', 'nombre_completo'] },
                    { model: Usuario, as: 'voluntario', attributes: ['nombre_usuario', 'nombre_completo'] }
                ]
            });
            res.status(200).json(updatedTrayecto);
        } else {
            res.status(404).json({ message: 'Journey not found' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Error updating journey', error: error.message });
    }
};

