const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const Usuario = sequelize.define('Usuario', {
    id: {
        type: DataTypes.INTEGER.UNSIGNED,
        primaryKey: true,
        autoIncrement: true
    },
    nombre_usuario: {
        type: DataTypes.STRING(50),
        allowNull: false,
        unique: true
    },
    email: {
        type: DataTypes.STRING(100),
        allowNull: false,
        unique: true
    },
    password_hash: {
        type: DataTypes.STRING(255),
        allowNull: false,
        comment: 'Contraseña cifrada'
    },
    nombre_completo: {
        type: DataTypes.STRING(100),
        allowNull: true
    },
    es_voluntario: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false
    },
    telefono: {
        type: DataTypes.STRING(20),
        allowNull: true
    },
    edad: {
        type: DataTypes.INTEGER,
        allowNull: true,
        comment: 'Edad del usuario'
    },
    genero: {
        type: DataTypes.STRING(20),
        allowNull: true,
        comment: 'Género del usuario'
    },
    rol_activo: {
        type: DataTypes.ENUM('voluntario', 'solicitante'),
        allowNull: true,
        comment: 'Rol actual del usuario'
    },
    fecha_registro: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW
    },
    email_verified: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },
    verification_token: {
        type: DataTypes.STRING,
        allowNull: true
    },
    reset_password_token: {
        type: DataTypes.STRING,
        allowNull: true
    },
    reset_password_expires: {
        type: DataTypes.DATE,
        allowNull: true
    }
}, {
    tableName: 'usuario',
    timestamps: false // We are using custom timestamp fields if needed, but schema has fecha_registro
});

module.exports = Usuario;
