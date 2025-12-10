const { sequelize } = require('../config/db');
const Usuario = require('./usuario.model');
const Trayecto = require('./trayecto.model');
const Mensaje = require('./mensaje.model');

// Associations

// Usuario <-> Trayecto (Solicitante)
Usuario.hasMany(Trayecto, { foreignKey: 'solicitante_id', as: 'trayectosSolicitados' });
Trayecto.belongsTo(Usuario, { foreignKey: 'solicitante_id', as: 'solicitante' });

// Usuario <-> Trayecto (Voluntario)
Usuario.hasMany(Trayecto, { foreignKey: 'voluntario_id', as: 'trayectosVoluntario' });
Trayecto.belongsTo(Usuario, { foreignKey: 'voluntario_id', as: 'voluntario' });

// Trayecto <-> Mensaje
Trayecto.hasMany(Mensaje, { foreignKey: 'trayecto_id', as: 'mensajes' });
Mensaje.belongsTo(Trayecto, { foreignKey: 'trayecto_id', as: 'trayecto' });

// Usuario <-> Mensaje (Emisor)
Usuario.hasMany(Mensaje, { foreignKey: 'emisor_id', as: 'mensajesEnviados' });
Mensaje.belongsTo(Usuario, { foreignKey: 'emisor_id', as: 'emisor' });

module.exports = {
    sequelize,
    Usuario,
    Trayecto,
    Mensaje
};
