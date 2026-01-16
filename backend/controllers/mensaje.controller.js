const { Mensaje, Usuario, Trayecto } = require('../models');

exports.createMensaje = async (req, res) => {
    try {
        const { trayecto_id, emisor_id, contenido } = req.body;

        // Validar que el usuario es participante en este trayecto
        const trayecto = await Trayecto.findByPk(trayecto_id);
        
        if (!trayecto) {
            return res.status(404).json({ message: 'Journey not found' });
        }

        // Verificar que emisor_id es el solicitante o voluntario actual
        if (trayecto.solicitante_id !== emisor_id && trayecto.voluntario_id !== emisor_id) {
            return res.status(403).json({ 
                message: 'No tienes permiso para enviar mensajes en este chat',
                error: 'FORBIDDEN'
            });
        }

        // Validar que el trayecto está en estado ACEPTADO (conversación activa)
        if (trayecto.estado !== 'ACEPTADO') {
            return res.status(400).json({ 
                message: 'No puedes enviar mensajes en una solicitud que no está activa',
                error: 'INVALID_STATE'
            });
        }

        const mensaje = await Mensaje.create({ trayecto_id, emisor_id, contenido });
        res.status(201).json(mensaje);
    } catch (error) {
        res.status(500).json({ message: 'Error creating message', error: error.message });
    }
};

exports.getMensajesByTrayecto = async (req, res) => {
    try {
        const { trayectoId } = req.params;
        const { userId } = req.query; // Se envía desde el frontend

        // Obtener el trayecto
        const trayecto = await Trayecto.findByPk(trayectoId);
        
        if (!trayecto) {
            return res.status(404).json({ message: 'Journey not found' });
        }

        // Validar que el usuario actual es el solicitante o voluntario
        if (!userId || (trayecto.solicitante_id !== parseInt(userId) && trayecto.voluntario_id !== parseInt(userId))) {
            return res.status(403).json({ 
                message: 'No tienes permiso para ver estos mensajes',
                error: 'FORBIDDEN'
            });
        }

        // Solo obtener mensajes si el trayecto está activo (ACEPTADO)
        // o si la persona es el solicitante y simplemente quiere ver el histórico
        const mensajes = await Mensaje.findAll({
            where: { trayecto_id: trayectoId },
            include: [{ model: Usuario, as: 'emisor', attributes: ['nombre_usuario'] }],
            order: [['fecha_envio', 'ASC']]
        });
        
        res.status(200).json(mensajes);
    } catch (error) {
        res.status(500).json({ message: 'Error retrieving messages', error: error.message });
    }
};

// Eliminar mensajes de un trayecto (se llama cuando se cancela la ayuda)
exports.deleteMensajesByTrayecto = async (req, res) => {
    try {
        const { trayectoId } = req.params;

        const deletedCount = await Mensaje.destroy({
            where: { trayecto_id: trayectoId }
        });

        res.status(200).json({ 
            message: 'Messages deleted successfully',
            deletedCount: deletedCount
        });
    } catch (error) {
        res.status(500).json({ message: 'Error deleting messages', error: error.message });
    }
};
