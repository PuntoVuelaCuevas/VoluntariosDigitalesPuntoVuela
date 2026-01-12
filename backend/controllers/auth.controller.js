const bcrypt = require('bcrypt');
const crypto = require('crypto');
const { Usuario } = require('../models');
const { sendVerificationEmail, sendPasswordResetEmail } = require('../config/mailer');

// Registrar nuevo usuario
exports.register = async (req, res) => {
    try {
        const { nombre_completo, email, password, edad, genero, localidad, rol } = req.body;

        // Validar campos requeridos
        if (!nombre_completo || !email || !password || !rol) {
            return res.status(400).json({
                message: 'Nombre, email, contraseña y rol son requeridos'
            });
        }

        // Verificar si el email ya existe
        let usuario = await Usuario.findOne({ where: { email } });

        if (usuario) {
            if (usuario.email_verified) {
                return res.status(400).json({
                    message: 'El email ya está registrado'
                });
            } else {
                // Usuario existe pero no está verificado: REENVIAR CORREO
                const verification_token = crypto.randomBytes(32).toString('hex');
                usuario.verification_token = verification_token;
                // Actualizar password si lo cambiaron (opcional, aquí lo mantenemos simple)
                await usuario.save();

                sendVerificationEmail(usuario, verification_token);

                return res.status(200).json({
                    message: 'Usuario ya registrado pero no verificado. Hemos reenviado el correo.'
                });
            }
        }

        // Si no existe, continuamos con el registro normal
        // Generar nombre de usuario único...

        // Generar nombre de usuario único
        const nombre_usuario = email.split('@')[0] + '_' + Date.now();

        // Hash de la contraseña
        const password_hash = await bcrypt.hash(password, 10);

        // Generar token de verificación
        const verification_token = crypto.randomBytes(32).toString('hex');

        // Crear usuario
        const nuevoUsuario = await Usuario.create({
            nombre_usuario,
            email,
            password_hash,
            nombre_completo,
            edad: edad || null,
            genero: genero || null,
            localidad: localidad || null,
            es_voluntario: rol === 'voluntario',
            rol_activo: rol,
            email_verified: false,
            verification_token
        });

        // Enviar correo de verificación (sin esperar await para no bloquear)
        sendVerificationEmail(nuevoUsuario, verification_token);

        // Responder
        res.status(201).json({
            id: nuevoUsuario.id,
            nombre_usuario: nuevoUsuario.nombre_usuario,
            email: nuevoUsuario.email,
            nombre_completo: nuevoUsuario.nombre_completo,
            edad: nuevoUsuario.edad,
            genero: nuevoUsuario.genero,
            rol_activo: nuevoUsuario.rol_activo,
            message: 'Usuario registrado. Por favor verifica tu correo.'
        });
    } catch (error) {
        console.error('Error in register:', error);
        res.status(500).json({
            message: 'Error al registrar usuario',
            error: error.message
        });
    }
};

// Verificar Email
exports.verifyEmail = async (req, res) => {
    try {
        const { token } = req.params;

        const usuario = await Usuario.findOne({ where: { verification_token: token } });

        if (!usuario) {
            // Si no hay usuario/token, probablemente ya se verificó.
            // En vez de error feo, redirigimos al login para que entre directo.
            return res.redirect('https://voluntariosdigitalespuntovuela-pearl.vercel.app/');
        }

        usuario.email_verified = true;
        usuario.verification_token = null; // Invalidar token
        await usuario.save();

        // Redirigir al frontend (login)
        res.redirect('https://voluntariosdigitalespuntovuela-pearl.vercel.app/');
    } catch (error) {
        console.error('Error verifying email:', error);
        // En caso de error grave, también redirigimos o mostramos algo más amable
        res.redirect('https://voluntariosdigitalespuntovuela-pearl.vercel.app/');
    }
};

// Login
exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Validar campos
        if (!email || !password) {
            return res.status(400).json({
                message: 'Email y contraseña son requeridos'
            });
        }

        // Buscar usuario
        const usuario = await Usuario.findOne({ where: { email } });
        if (!usuario) {
            return res.status(401).json({
                message: 'Email o contraseña incorrectos'
            });
        }

        // Verificar contraseña
        const isValidPassword = await bcrypt.compare(password, usuario.password_hash);
        if (!isValidPassword) {
            return res.status(401).json({
                message: 'Email o contraseña incorrectos'
            });
        }

        // Verificar si el email está validado
        if (!usuario.email_verified) {
            return res.status(403).json({
                message: 'Por favor verifica tu correo antes de iniciar sesión.'
            });
        }

        // Responder con datos del usuario (sin password_hash)
        res.json({
            id: usuario.id,
            nombre_usuario: usuario.nombre_usuario,
            email: usuario.email,
            nombre_completo: usuario.nombre_completo,
            edad: usuario.edad,
            genero: usuario.genero,
            rol_activo: usuario.rol_activo,
            es_voluntario: usuario.es_voluntario
        });
    } catch (error) {
        console.error('Error in login:', error);
        res.status(500).json({
            message: 'Error al iniciar sesión',
            error: error.message
        });
    }
};

// Solicitar recuperación de contraseña
exports.forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;

        const usuario = await Usuario.findOne({ where: { email } });
        if (!usuario) {
            // Por seguridad, no decimos si existe o no, pero por UX aquí diremos que se envió si existe.
            // O podemos ser claros si es una app interna/pequeña.
            return res.status(404).json({ message: 'No existe un usuario con ese correo electrónico.' });
        }

        // Generar token
        const resetToken = crypto.randomBytes(32).toString('hex');
        const tokenExpires = Date.now() + 3600000; // 1 hora

        usuario.reset_password_token = resetToken;
        usuario.reset_password_expires = tokenExpires;
        await usuario.save();

        await sendPasswordResetEmail(usuario.email, resetToken);

        res.json({ message: 'Se ha enviado un correo para restablecer la contraseña.' });
    } catch (error) {
        console.error('Error in forgotPassword:', error);
        res.status(500).json({ message: 'Error al procesar la solicitud.' });
    }
};

// Restablecer contraseña con token
exports.resetPassword = async (req, res) => {
    try {
        const { token, newPassword } = req.body;

        const usuario = await Usuario.findOne({
            where: {
                reset_password_token: token,
                reset_password_expires: { [require('sequelize').Op.gt]: Date.now() } // Expiración mayor a ahora
            }
        });

        if (!usuario) {
            return res.status(400).json({ message: 'El enlace es inválido o ha expirado.' });
        }

        // Hashear nueva contraseña
        const password_hash = await bcrypt.hash(newPassword, 10);

        usuario.password_hash = password_hash;
        usuario.reset_password_token = null;
        usuario.reset_password_expires = null;
        await usuario.save();

        res.json({ message: 'Contraseña actualizada correctamente. Ahora puedes iniciar sesión.' });
    } catch (error) {
        console.error('Error in resetPassword:', error);
        res.status(500).json({ message: 'Error al restablecer la contraseña.' });
    }
};

exports.testEmail = async (req, res) => {
    try {
        const { email } = req.params;
        const nodemailer = require('nodemailer');
        // Importamos directamente para ver la config real cargada
        const { sendTestEmail, verifyConnection } = require('../config/mailer');

        // HACK: Requerir el archivo mailer.js para intentar leer el objeto transporter si fuera exportado
        // Como no exportamos el transporter directamente, no podemos ver sus options fácilmente sin modificar mailer.js
        // Pero podemos inferir si el cambio se aplicó viendo si el error cambia o si el timeout funciona.

        console.log("Testing connection...");
        await verifyConnection();

        console.log(`Sending test email to ${email}...`);
        const info = await sendTestEmail(email);

        res.json({
            message: 'Email enviado correctamente',
            info: info
        });
    } catch (error) {
        console.error('Test email failed:', error);

        // Intentar leer variables de entorno para ver qué está leyendo el proceso
        const debugConfig = {
            port: process.env.EMAIL_PORT || 'No definido (Usa default del código)',
            // Nota: El código usa 465 hardcodeado ahora, así que esto no nos dirá mucho salvo que hayamos cambiado el código
            user: process.env.EMAIL_USER ? '***' : 'Missing',
            pass: process.env.EMAIL_PASS ? '***' : 'Missing'
        };

        res.status(500).json({
            message: 'Error enviando email de prueba',
            error: error.message,
            stack: error.stack,
            debug: {
                timestamp: new Date().toISOString(),
                hint: "Si sigue saliendo timeout en puerto 465, Railway bloquea SMTP."
            }
        });
    }
};
