const { Usuario } = require('../models');
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

// Obtener usuarios pendientes de aprobación (con más detalles)
exports.getPendingUsersForAdmin = async (req, res) => {
    try {
        // Obtener todos los usuarios verificados
        const usuariosVerificados = await Usuario.findAll({
            where: {
                email_verified: true
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
                'nombre_usuario'
            ],
            order: [['fecha_registro', 'DESC']],
            raw: true
        });

        // Filtrar los que NO están aprobados
        const approvedData = getApprovedUsers();
        const usuariosPendientes = usuariosVerificados.filter(
            u => !approvedData.approvedUserIds.includes(u.id)
        );

        // Procesar datos para mostrar
        const pendingWithStatus = usuariosPendientes.map(u => ({
            ...u,
            approved: false,
            fecha_registro: new Date(u.fecha_registro).toLocaleString('es-ES')
        }));

        const approvedUsers = usuariosVerificados
            .filter(u => approvedData.approvedUserIds.includes(u.id))
            .map(u => ({
                ...u,
                approved: true,
                fecha_registro: new Date(u.fecha_registro).toLocaleString('es-ES')
            }));

        res.json({
            pending: pendingWithStatus,
            approved: approvedUsers,
            pendingCount: pendingWithStatus.length,
            approvedCount: approvedUsers.length,
            totalUsers: usuariosVerificados.length
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

        // Leer archivo de aprobados
        const approvedData = getApprovedUsers();

        // Si ya estaba aprobado
        if (approvedData.approvedUserIds.includes(usuario.id)) {
            return res.status(400).json({
                message: 'El usuario ya estaba aprobado'
            });
        }

        // Agregar a aprobados
        approvedData.approvedUserIds.push(usuario.id);
        saveApprovedUsers(approvedData);

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
