const { Usuario, Trayecto } = require('../models');
const { sequelize } = require('../models');

exports.getRanking = async (req, res) => {
    try {
        // Obtener ranking de voluntarios basado en ayudas completadas
        const ranking = await Usuario.findAll({
            attributes: [
                'id',
                'nombre_completo',
                'localidad',
                [sequelize.fn('COUNT', sequelize.col('trayectosVoluntario.id')), 'ayudas_completadas']
            ],
            include: [{
                model: Trayecto,
                as: 'trayectosVoluntario',
                attributes: [],
                where: { estado: 'COMPLETADO' },
                required: false
            }],
            where: {
                es_voluntario: true
            },
            group: ['Usuario.id'],
            subQuery: false,
            order: [[sequelize.literal('ayudas_completadas'), 'DESC']],
            limit: 15
        });

        // Formatear respuesta
        const formattedRanking = ranking.map((user, index) => ({
            posicion: index + 1,
            id: user.id,
            nombre: user.nombre_completo,
            localidad: user.localidad || 'No especificada',
            ayudas_completadas: parseInt(user.dataValues.ayudas_completadas) || 0
        }));

        res.json(formattedRanking);
    } catch (error) {
        console.error('Error getting ranking:', error);
        res.status(500).json({ message: 'Error al obtener el ranking' });
    }
};
