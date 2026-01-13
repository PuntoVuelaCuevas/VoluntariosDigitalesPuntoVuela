const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const Trayecto = sequelize.define('Trayecto', {
    id: {
        type: DataTypes.INTEGER.UNSIGNED,
        primaryKey: true,
        autoIncrement: true
    },
    solicitante_id: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: false
    },
    titulo: {
        type: DataTypes.STRING(100),
        allowNull: false
    },
    descripcion: {
        type: DataTypes.TEXT,
        allowNull: false
    },
    ubicacion_origen: {
        type: DataTypes.STRING(255),
        allowNull: false
    },
    ubicacion_destino: {
        type: DataTypes.STRING(255),
        allowNull: false
    },
    fecha_necesaria: {
        type: DataTypes.DATE,
        allowNull: false
    },
    estado: {
        type: DataTypes.ENUM('PENDIENTE', 'ACEPTADO', 'COMPLETADO', 'CANCELADO', 'EXPIRADO'),
        allowNull: false,
        defaultValue: 'PENDIENTE'
    },
    voluntario_id: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: true,
        defaultValue: null
    },
    fecha_creacion: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW
    },
    confirmacion_solicitante: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false
    },
    confirmacion_voluntario: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false
    }
}, {
    tableName: 'trayectos_solicitados',
    timestamps: false
});

module.exports = Trayecto;
