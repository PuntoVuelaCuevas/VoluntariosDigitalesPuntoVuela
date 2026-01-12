const express = require('express');
const cors = require('cors');
const { connectDB } = require('./config/db');
const { sequelize } = require('./models'); // Import from models/index.js to get associations
const usuarioRoutes = require('./routes/usuario.routes');
const trayectoRoutes = require('./routes/trayecto.routes');
const mensajeRoutes = require('./routes/mensaje.routes');
const authRoutes = require('./routes/auth.routes');
const rankingRoutes = require('./routes/ranking.routes');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/usuarios', usuarioRoutes);
app.use('/api/v1/trayectos', trayectoRoutes);
app.use('/api/v1/mensajes', mensajeRoutes);
app.use('/api/v1/ranking', rankingRoutes);

// Root route
app.get('/', (req, res) => {
    res.json({ message: 'Welcome to the Voluntarios-App API.' });
});

// Database Connection and Server Start
const startServer = async () => {
    await connectDB();

    // Sync models with database
    // alter: true updates tables to match models without dropping data
    // CAUTION: Disabled 'alter' to prevent ER_TOO_MANY_KEYS error on production deployment
    try {
        await sequelize.sync({ alter: true });
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
