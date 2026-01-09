const nodemailer = require('nodemailer');
require('dotenv').config();

const transporter = nodemailer.createTransport({
    host: 'smtp-relay.brevo.com',
    port: 587,
    secure: false, // true for 465, false for other ports
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    },
    // Brevo suele ser más fiable, no necesita hacks de timeout extremos, pero dejamos un log básico
    logger: true,
    debug: true
});

const sendNewRequestNotification = async (trayecto, recipients) => {
    try {
        if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
            console.warn('Email credentials not found. Skipping notification.');
            return;
        }

        // Usamos EMAIL_FROM si existe, si no, intentamos usar EMAIL_USER, y si no, un string vacío
        const senderEmail = process.env.EMAIL_FROM || process.env.EMAIL_USER;
        const mailOptions = {
            from: `"Voluntarios Punto Vuela" <${senderEmail}>`,
            bcc: recipients, // Blind Carbon Copy for privacy
            subject: `📢 Nueva Solicitud de Ayuda: ${trayecto.titulo}`,
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2 style="color: #2563eb;">Nueva Solicitud de Ayuda</h2>
                    <p>Hola voluntario,</p>
                    <p>Se ha creado una nueva solicitud de ayuda en la plataforma que podría interesarte.</p>
                    
                    <div style="background-color: #f3f4f6; padding: 15px; border-radius: 8px; margin: 20px 0;">
                        <h3 style="margin-top: 0;">${trayecto.titulo}</h3>
                        <p><strong>Descripción:</strong> ${trayecto.descripcion}</p>
                        <p><strong>Origen:</strong> ${trayecto.ubicacion_origen}</p>
                        <p><strong>Destino:</strong> ${trayecto.ubicacion_destino}</p>
                    </div>

                    <p>Entra en la aplicación para ver más detalles y aceptar la ayuda si estás disponible.</p>
                    
                    <a href="https://mi-proyecto-pearl.vercel.app/" style="background-color: #eab308; color: black; padding: 10px 20px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">Ir a la App</a>
                </div>
            `
        };

        const info = await transporter.sendMail(mailOptions);
        console.log('Notification email sent:', info.messageId);
        return info;
    } catch (error) {
        console.error('Error sending email notification:', error);
        // Don't throw error to prevent blocking the request creation
    }
};

const sendVerificationEmail = async (user, token) => {
    try {
        if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
            console.warn('Email credentials not found. Skipping verification email.');
            return;
        }

        const verificationLink = `https://backend-voluntariosapp.onrender.com/api/v1/auth/verify/${token}`;

        const senderEmail = process.env.EMAIL_FROM || process.env.EMAIL_USER;
        const mailOptions = {
            from: `"Voluntarios Punto Vuela" <${senderEmail}>`,
            to: user.email,
            subject: `Verifica tu cuenta en Voluntarios Punto Vuela`,
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2 style="color: #2563eb;">¡Bienvenido/a, ${user.nombre_completo}!</h2>
                    <p>Gracias por registrarte. Para comenzar a usar tu cuenta, por favor verifica tu correo electrónico.</p>
                    
                    <div style="text-align: center; margin: 30px 0;">
                        <a href="${verificationLink}" style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">Verificar mi Correo</a>
                    </div>

                    <p style="font-size: 12px; color: #666;">Si no has creado esta cuenta, puedes ignorar este correo.</p>
                </div>
            `
        };

        const info = await transporter.sendMail(mailOptions);
        console.log('Verification email sent:', info.messageId);
        return info;
    } catch (error) {
        console.error('Error sending verification email:', error);
    }
};

const verifyConnection = async () => {
    try {
        await transporter.verify();
        console.log('Transporter verification success');
        return true;
    } catch (error) {
        console.error('Transporter verification failed:', error);
        throw error;
    }
};

const sendTestEmail = async (targetEmail) => {
    const senderEmail = process.env.EMAIL_FROM || process.env.EMAIL_USER;
    const mailOptions = {
        from: `"Test Debug" <${senderEmail}>`,
        to: targetEmail,
        subject: "Test de Configuración Railway",
        text: "Si lees esto, el email funciona correctamente."
    };
    return transporter.sendMail(mailOptions); // This will throw if it fails, allowing us to see the error
};

module.exports = { sendNewRequestNotification, sendVerificationEmail, verifyConnection, sendTestEmail };
