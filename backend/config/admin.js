// Configuración de admin
// Credenciales hardcodeadas (cambiar en producción por hash)
const bcrypt = require('bcrypt');

const ADMIN_CREDENTIALS = {
    username: 'admin',
    password_hash: '$2b$10$U8plx4NLmbA1XWkXfRsqrexzzv9mljcbDRBTLFZXf5oMbZsdHi00C' // Hash de "puntovuela123"
};

// Función para verificar credenciales admin
const verifyAdminCredentials = async (username, password) => {
    if (username !== ADMIN_CREDENTIALS.username) {
        return false;
    }
    
    return await bcrypt.compare(password, ADMIN_CREDENTIALS.password_hash);
};

// Generar token JWT simple (sin librerías externas)
const generateAdminToken = () => {
    // Token simple: base64(username + timestamp)
    // En producción, usar jsonwebtoken
    const token = Buffer.from(
        JSON.stringify({
            username: ADMIN_CREDENTIALS.username,
            timestamp: Date.now(),
            type: 'admin'
        })
    ).toString('base64');
    
    return token;
};

// Verificar token de admin
const verifyAdminToken = (token) => {
    try {
        const decoded = JSON.parse(Buffer.from(token, 'base64').toString('utf-8'));
        // Token válido si es reciente (menos de 24 horas)
        const now = Date.now();
        const maxAge = 24 * 60 * 60 * 1000; // 24 horas
        
        if (decoded.type === 'admin' && (now - decoded.timestamp) < maxAge) {
            return true;
        }
        return false;
    } catch (error) {
        return false;
    }
};

module.exports = {
    verifyAdminCredentials,
    generateAdminToken,
    verifyAdminToken
};
