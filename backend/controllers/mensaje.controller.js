const { Mensaje, Usuario } = require('../models');

exports.createMensaje = async (req, res) => {
    try {
        const mensaje = await Mensaje.create(req.body);
        res.status(201).json(mensaje);
    } catch (error) {
        res.status(500).json({ message: 'Error creating message', error: error.message });
    }
};

exports.getMensajesByTrayecto = async (req, res) => {
    try {
        const { trayectoId } = req.params;
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
