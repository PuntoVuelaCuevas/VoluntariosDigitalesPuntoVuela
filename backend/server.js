const express = require('express');
const cors = require('cors');
const { connectDB } = require('./config/db');
const { sequelize } = require('./models'); // Import from models/index.js to get associations
const { QueryTypes } = require('sequelize');
const usuarioRoutes = require('./routes/usuario.routes');
const trayectoRoutes = require('./routes/trayecto.routes');
const mensajeRoutes = require('./routes/mensaje.routes');
const authRoutes = require('./routes/auth.routes');
const rankingRoutes = require('./routes/ranking.routes');
const adminRoutes = require('./routes/admin.routes');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/admin', adminRoutes);
app.use('/api/v1/usuarios', usuarioRoutes);
app.use('/api/v1/trayectos', trayectoRoutes);
app.use('/api/v1/mensajes', mensajeRoutes);
app.use('/api/v1/ranking', rankingRoutes);

// Root route
app.get('/', (req, res) => {
    res.json({ message: 'Welcome to the Voluntarios-App API.' });
});

// Database Connection and Server Start
const ensureUserSchema = async () => {
    try {
        const databaseName = process.env.DB_DATABASE;
        const query = databaseName
            ? `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'usuario'`
            : `SHOW COLUMNS FROM ` + sequelize.getQueryInterface().quoteIdentifier('usuario');

        const columns = await sequelize.query(query, {
            replacements: databaseName ? [databaseName] : [],
            type: QueryTypes.SELECT
        });

        const existingColumns = columns.map(c => {
            if (c.COLUMN_NAME) return c.COLUMN_NAME.toLowerCase();
            if (c.Field) return c.Field.toLowerCase();
            return null;
        }).filter(Boolean);

        if (!existingColumns.includes('email_verified')) {
            console.log('Agregar columna email_verified a usuario...');
            await sequelize.query("ALTER TABLE `usuario` ADD COLUMN `email_verified` BOOLEAN NOT NULL DEFAULT FALSE");
        }

        if (!existingColumns.includes('aprobado')) {
            console.log('Agregar columna aprobado a usuario...');
            await sequelize.query("ALTER TABLE `usuario` ADD COLUMN `aprobado` BOOLEAN NOT NULL DEFAULT FALSE COMMENT 'Si el usuario ha sido aprobado por el admin'");
        }
    } catch (error) {
        console.error('No se pudo verificar/actualizar el esquema de usuario:', error);
        throw error;
    }
};

const startServer = async () => {
    await connectDB();
    await ensureUserSchema();

    // Sync models with database
    // alter: true updates tables to match models without dropping data
    // CAUTION: Disabled 'alter' to prevent ER_TOO_MANY_KEYS error on production deployment
    try {
        await sequelize.sync({ alter: false });
        console.log('Database synced (Voluntarios-App schema).');
    } catch (syncError) {
        console.error('Error syncing database:', syncError);
        // Continue even if sync fails (assuming schema is already compatible or error is minor)
    }

    app.listen(PORT, () => {
        console.log(`Server is running on port ${PORT}.`);
    });
};

startServer();
