const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const Mensaje = sequelize.define('Mensaje', {
    id: {
        type: DataTypes.INTEGER.UNSIGNED,
        primaryKey: true,
        autoIncrement: true
    },
    trayecto_id: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: false
    },
    emisor_id: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: false
    },
    contenido: {
        type: DataTypes.TEXT,
        allowNull: false
    },
    fecha_envio: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW
    }
}, {
    tableName: 'mensajes',
    timestamps: false
});

module.exports = Mensaje;
