const Sequelize = require('sequelize');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const { DB_HOST, DB_USER, DB_PASSWORD, DB_DATABASE, DB_PORT, MYSQL_SSL_CA_PATH } = process.env;

let sslOptions = {};
if (MYSQL_SSL_CA_PATH) {
    const caPath = path.resolve(MYSQL_SSL_CA_PATH);
    if (fs.existsSync(caPath)) {
        sslOptions = {
            ca: fs.readFileSync(caPath),
            rejectUnauthorized: true
        };
        console.log('Using SSL certificate from:', caPath);
    } else {
        console.warn(`Warning: SSL Certificate not found at ${caPath}.`);
        console.warn('Connecting with SSL but without certificate verification (not recommended for production).');
        sslOptions = {
            rejectUnauthorized: false
        };
    }
} else {
    // If no CA path specified, use SSL without certificate verification
    console.warn('MYSQL_SSL_CA_PATH not set. Using SSL without certificate verification.');
    sslOptions = {
        rejectUnauthorized: false
    };
}

const sequelize = new Sequelize(DB_DATABASE, DB_USER, DB_PASSWORD, {
    host: DB_HOST,
    port: DB_PORT,
    dialect: 'mysql',
    dialectOptions: {
        ssl: sslOptions
    },
    logging: false,
});

const connectDB = async () => {
    try {
        await sequelize.authenticate();
        console.log('Connection to MySQL (Aiven.io) has been established successfully.');
    } catch (error) {
        console.error('Unable to connect to the database:', error);
        process.exit(1);
    }
};

module.exports = { sequelize, connectDB };
