const { Usuario } = require('../models');
const { sequelize } = require('../config/db');
const { QueryTypes } = require('sequelize');
const { verifyAdminCredentials, generateAdminToken, verifyAdminToken } = require('../config/admin');
const fs = require('fs');
const path = require('path');

// Ruta al archivo de usuarios aprobados
const APPROVED_USERS_FILE = path.join(__dirname, '../config/approved-users.json');

// Función auxiliar para leer usuarios aprobados
const getApprovedUsers = () => {
    try {
        if (!fs.existsSync(APPROVED_USERS_FILE)) {
            fs.writeFileSync(APPROVED_USERS_FILE, JSON.stringify({ approvedUserIds: [] }, null, 2));
        }
        const data = fs.readFileSync(APPROVED_USERS_FILE, 'utf-8');
        return JSON.parse(data);
    } catch (error) {
        console.error('Error reading approved users file:', error);
        return { approvedUserIds: [] };
    }
};

// Función auxiliar para guardar usuarios aprobados
const saveApprovedUsers = (data) => {
    try {
        fs.writeFileSync(APPROVED_USERS_FILE, JSON.stringify(data, null, 2));
    } catch (error) {
        console.error('Error saving approved users file:', error);
    }
};

// Login de admin
exports.adminLogin = async (req, res) => {
    try {
        const { username, password } = req.body;

        if (!username || !password) {
            return res.status(400).json({
                message: 'Usuario y contraseña requeridos'
            });
        }

        // Verificar credenciales
        const isValid = await verifyAdminCredentials(username, password);

        if (!isValid) {
            return res.status(401).json({
                message: 'Credenciales incorrectas'
            });
        }

        // Generar token
        const token = generateAdminToken();

        res.json({
            success: true,
            token,
            username,
            message: 'Sesión de admin iniciada'
        });
    } catch (error) {
        console.error('Error in adminLogin:', error);
        res.status(500).json({
            message: 'Error al iniciar sesión',
            error: error.message
        });
    }
};

// Middleware para verificar token de admin
exports.verifyAdminAuth = (req, res, next) => {
    try {
        const token = req.headers.authorization?.replace('Bearer ', '');

        if (!token || !verifyAdminToken(token)) {
            return res.status(401).json({
                message: 'Acceso denegado. Token inválido o expirado.'
            });
        }

        next();
    } catch (error) {
        res.status(401).json({
            message: 'Error al verificar autenticación'
        });
    }
};

const ensureAprobadoColumn = async () => {
    const columns = await sequelize.query(
        `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'usuario' AND COLUMN_NAME = 'aprobado'`,
        { type: QueryTypes.SELECT }
    );

    if (!columns.some(c => c.COLUMN_NAME?.toLowerCase() === 'aprobado')) {
        console.log('Agregar columna aprobado a usuario desde admin.controller...');
        await sequelize.query("ALTER TABLE `usuario` ADD COLUMN `aprobado` BOOLEAN NOT NULL DEFAULT FALSE COMMENT 'Si el usuario ha sido aprobado por el admin'");
    }
};

const loadAdminUsers = async () => {
    const usuariosPendientes = await Usuario.findAll({
        where: {
            aprobado: false
        },
        attributes: [
            'id',
            'nombre_completo',
            'email',
            'edad',
            'genero',
            'localidad',
            'rol_activo',
            'fecha_registro',
            'nombre_usuario',
            'email_verified'
        ],
        order: [['fecha_registro', 'DESC']],
        raw: true
    });

    const usuariosAprobados = await Usuario.findAll({
        where: {
            aprobado: true
        },
        attributes: [
            'id',
            'nombre_completo',
            'email',
            'edad',
            'genero',
            'localidad',
            'rol_activo',
            'fecha_registro',
            'nombre_usuario',
            'email_verified'
        ],
        order: [['fecha_registro', 'DESC']],
        raw: true
    });

    return { usuariosPendientes, usuariosAprobados };
};

// Obtener usuarios pendientes de aprobación (con más detalles)
exports.getPendingUsersForAdmin = async (req, res) => {
    try {
        let usuariosPendientes;
        let usuariosAprobados;

        try {
            ({ usuariosPendientes, usuariosAprobados } = await loadAdminUsers());
        } catch (innerError) {
            if (innerError.message?.includes('Unknown column') && innerError.message?.includes('aprobado')) {
                console.warn('Columna aprobado no existe en la tabla usuario. Intentando crearla...');
                await ensureAprobadoColumn();
                ({ usuariosPendientes, usuariosAprobados } = await loadAdminUsers());
            } else {
                throw innerError;
            }
        }

        const pendingWithStatus = usuariosPendientes.map(u => ({
            ...u,
            approved: false,
            fecha_registro: new Date(u.fecha_registro).toLocaleString('es-ES')
        }));

        const approvedFormatted = usuariosAprobados.map(u => ({
            ...u,
            approved: true,
            fecha_registro: new Date(u.fecha_registro).toLocaleString('es-ES')
        }));

        res.json({
            pending: pendingWithStatus,
            approved: approvedFormatted,
            pendingCount: pendingWithStatus.length,
            approvedCount: approvedFormatted.length,
            totalUsers: usuariosPendientes.length + usuariosAprobados.length
        });
    } catch (error) {
        console.error('Error in getPendingUsersForAdmin:', error);
        res.status(500).json({
            message: 'Error al obtener usuarios',
            error: error.message
        });
    }
};

// Aprobar usuario
exports.approveUserAsAdmin = async (req, res) => {
    try {
        const { userId } = req.params;

        // Verificar que el usuario existe
        const usuario = await Usuario.findByPk(userId);
        if (!usuario) {
            return res.status(404).json({
                message: 'Usuario no encontrado'
            });
        }

        // Si ya estaba aprobado
        if (usuario.aprobado) {
            return res.status(400).json({
                message: 'El usuario ya estaba aprobado'
            });
        }

        // Actualizar en BD
        usuario.aprobado = true;
        await usuario.save();

        res.json({
            success: true,
            message: 'Usuario aprobado correctamente',
            usuario: {
                id: usuario.id,
                nombre_completo: usuario.nombre_completo,
                email: usuario.email,
                approved: true
            }
        });
    } catch (error) {
        console.error('Error in approveUserAsAdmin:', error);
        res.status(500).json({
            message: 'Error al aprobar usuario',
            error: error.message
        });
    }
};

// Denegar usuario (remover de pendientes - para implementación futura)
exports.denyUserAsAdmin = async (req, res) => {
    try {
        const { userId } = req.params;

        // Verificar que el usuario existe
        const usuario = await Usuario.findByPk(userId);
        if (!usuario) {
            return res.status(404).json({
                message: 'Usuario no encontrado'
            });
        }

        // Aquí puedes agregar lógica para denegar (ej: marcar como denegado)
        // Por ahora, solo indicamos que se denegó
        res.json({
            success: true,
            message: 'Usuario denegado',
            usuario: {
                id: usuario.id,
                nombre_completo: usuario.nombre_completo,
                email: usuario.email,
                denied: true
            }
        });
    } catch (error) {
        console.error('Error in denyUserAsAdmin:', error);
        res.status(500).json({
            message: 'Error al denegar usuario',
            error: error.message
        });
    }
};

// Logout de admin
exports.adminLogout = (req, res) => {
    res.json({
        success: true,
        message: 'Sesión cerrada'
    });
};
