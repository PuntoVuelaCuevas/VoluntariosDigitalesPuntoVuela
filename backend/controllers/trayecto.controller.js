const { Trayecto, Usuario } = require('../models');
const { sendNewRequestNotification } = require('../config/mailer');

exports.createTrayecto = async (req, res) => {
    try {
        console.log('Creating trayecto with data:', req.body);
        const trayecto = await Trayecto.create(req.body);
        console.log('Trayecto created successfully:', trayecto.id);

        // Enviar notificación por correo solo a voluntarios verificados
        try {
            const users = await Usuario.findAll({
                where: {
                    rol_activo: 'voluntario',
                    email_verified: true
                },
                attributes: ['email']
            });
            const recipients = users.map(u => u.email).filter(email => email); // Array de emails

            if (recipients.length > 0) {
                console.log(`Sending notification to ${recipients.length} users`);
                // Enviamos sin await para no bloquear la respuesta HTTP
                sendNewRequestNotification(trayecto, recipients);
            }
        } catch (emailError) {
            console.error('Error fetching users for notification:', emailError);
        }

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
        const { Op } = require('sequelize');
        const now = new Date();
        const tiempoExpiracion = new Date(now.getTime() - 30 * 60 * 1000);

        console.log(`Checking for expired requests. Now: ${now.toISOString()}, Expiration threshold: ${tiempoExpiracion.toISOString()}`);

        // Cambiar a EXPIRADO en lugar de eliminar
        const [updatedCount] = await Trayecto.update({ estado: 'EXPIRADO' }, {
            where: {
                estado: 'PENDIENTE',
                fecha_creacion: { [Op.lt]: tiempoExpiracion }
            }
        });

        if (updatedCount > 0) {
            console.log(`Marked ${updatedCount} requests as EXPIRADO.`);
        }

        const trayectos = await Trayecto.findAll({
            where: {
                [Op.or]: [
                    { estado: { [Op.ne]: 'PENDIENTE' } }, // Mostrar aceptados, completados, expirados
                    {
                        estado: 'PENDIENTE',
                        fecha_creacion: { [Op.gte]: tiempoExpiracion } // Mostrar pendientes activos
                    }
                ]
            },
            include: [
                { model: Usuario, as: 'solicitante', attributes: ['nombre_usuario', 'nombre_completo', 'edad', 'genero'] },
                { model: Usuario, as: 'voluntario', attributes: ['nombre_usuario', 'nombre_completo'] }
            ],
            order: [['fecha_creacion', 'DESC']]
        });

        console.log(`Returning ${trayectos.length} total requests.`);
        res.status(200).json(trayectos);
    } catch (error) {
        console.error('Error retrieving journeys:', error);
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
        const trayecto = await Trayecto.findByPk(req.params.id);
        
        if (!trayecto) {
            return res.status(404).json({ message: 'Journey not found' });
        }

        // Si alguien intenta aceptar una solicitud que ya está aceptada
        if (req.body.estado === 'ACEPTADO' && trayecto.estado === 'ACEPTADO') {
            return res.status(409).json({ 
                message: 'Esta solicitud ya ha sido aceptada por otro voluntario',
                conflictError: true,
                alreadyAcceptedBy: trayecto.voluntario_id
            });
        }

        // Si alguien intenta aceptar una solicitud que ya está pendiente y asigna voluntario_id
        if (req.body.voluntario_id && trayecto.voluntario_id && trayecto.voluntario_id !== req.body.voluntario_id) {
            return res.status(409).json({ 
                message: 'Esta solicitud ya ha sido aceptada por otro voluntario',
                conflictError: true,
                alreadyAcceptedBy: trayecto.voluntario_id
            });
        }

        await Trayecto.update(req.body, {
            where: { id: req.params.id }
        });

        // Verificar si ambas partes han confirmado para completar el trayecto
        const updatedTrayecto = await Trayecto.findByPk(req.params.id);
        if (updatedTrayecto &&
            updatedTrayecto.confirmacion_solicitante &&
            updatedTrayecto.confirmacion_voluntario &&
            updatedTrayecto.estado !== 'COMPLETADO') {

            await updatedTrayecto.update({ estado: 'COMPLETADO' });
        }

        const finalTrayecto = await Trayecto.findByPk(req.params.id, {
            include: [
                { model: Usuario, as: 'solicitante', attributes: ['nombre_usuario', 'nombre_completo'] },
                { model: Usuario, as: 'voluntario', attributes: ['nombre_usuario', 'nombre_completo'] }
            ]
        });

        if (finalTrayecto) {
            res.status(200).json(finalTrayecto);
        } else {
            res.status(404).json({ message: 'Journey not found' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Error updating journey', error: error.message });
    }
};

exports.deleteTrayecto = async (req, res) => {
    try {
        const deleted = await Trayecto.destroy({
            where: { id: req.params.id }
        });
        if (deleted) {
            res.status(200).json({ message: 'Journey deleted successfully' });
        } else {
            res.status(404).json({ message: 'Journey not found' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Error deleting journey', error: error.message });
    }
};
