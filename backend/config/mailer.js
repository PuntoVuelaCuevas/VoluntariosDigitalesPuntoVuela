// Usamos fetch nativo (Node 18+)
require('dotenv').config();

// Helper para enviar email usando Brevo API
const sendEmailViaAPI = async ({ to, subject, htmlContent }) => {
    const apiKey = process.env.BREVO_API_KEY;

    if (!apiKey) {
        console.error('BREVO_API_KEY no está definida.');
        throw new Error('Missing BREVO_API_KEY');
    }

    const senderEmail = process.env.EMAIL_FROM || 'puntovuelacuevas@gmail.com';
    const senderName = "Voluntarios Punto Vuela";

    // Preparar destinatarios (maneja array o string)
    const toAddresses = Array.isArray(to) ? to : [to];
    const toPayload = toAddresses.map(email => ({ email }));

    const response = await fetch('https://api.brevo.com/v3/smtp/email', {
        method: 'POST',
        headers: {
            'accept': 'application/json',
            'api-key': apiKey,
            'content-type': 'application/json'
        },
        body: JSON.stringify({
            sender: { name: senderName, email: senderEmail },
            to: toPayload,
            subject: subject,
            htmlContent: htmlContent
        })
    });

    if (!response.ok) {
        const errorData = await response.json();
        console.error('Brevo API Error:', errorData);
        throw new Error(`Brevo API Failed: ${JSON.stringify(errorData)}`);
    }

    const data = await response.json();
    return data;
};

const sendNewRequestNotification = async (trayecto, recipients) => {
    try {
        const subject = `📢 Nueva Solicitud de Ayuda: ${trayecto.titulo}`;
        const html = `
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
                
                <a href="https://voluntariosdigitalespuntovuela-pearl.vercel.app/" style="background-color: #eab308; color: black; padding: 10px 20px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">Ir a la App</a>
            </div>
        `;

        // La API espera destinatarios individuales en 'to', o usamos BCC si queremos ocultarlos.
        // Simularemos BCC enviando loop individual o usando BCC field si la API lo soporta (lo soporta).
        // Para simplificar y evitar compartir emails, Brevo API soporta 'bcc'.

        // Pero esta función recibía 'recipients' (array de strings).
        // Brevo API BCC format: [{email: '...'}, {email: '...'}]

        const bccPayload = recipients.map(email => ({ email }));
        const senderEmail = process.env.EMAIL_FROM || 'puntovuelacuevas@gmail.com';

        const response = await fetch('https://api.brevo.com/v3/smtp/email', {
            method: 'POST',
            headers: {
                'accept': 'application/json',
                'api-key': process.env.BREVO_API_KEY,
                'content-type': 'application/json'
            },
            body: JSON.stringify({
                sender: { name: "Voluntarios Punto Vuela", email: senderEmail },
                to: [{ email: senderEmail }], // 'To' obligatorio, nos lo mandamos a nosotros mismos
                bcc: bccPayload,
                subject: subject,
                htmlContent: html
            })
        });

        const info = await response.json();
        console.log('Notification email sent (API):', info.messageId);
        return info;

    } catch (error) {
        console.error('Error sending email notification:', error);
    }
};

const sendVerificationEmail = async (user, token) => {
    try {
        const verificationLink = `https://voluntariosdigitalespuntovuela-production.up.railway.app/api/v1/auth/verify/${token}`;

        const html = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #2563eb;">¡Bienvenido/a, ${user.nombre_completo}!</h2>
                <p>Gracias por registrarte. Para comenzar a usar tu cuenta, por favor verifica tu correo electrónico.</p>
                
                <div style="text-align: center; margin: 30px 0;">
                    <a href="${verificationLink}" style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">Verificar mi Correo</a>
                </div>

                <p style="font-size: 12px; color: #666;">Si no has creado esta cuenta, puedes ignorar este correo.</p>
            </div>
        `;

        const info = await sendEmailViaAPI({
            to: user.email,
            subject: 'Verifica tu cuenta en Voluntarios Punto Vuela',
            htmlContent: html
        });

        console.log('Verification email sent (API):', info.messageId);
        return info;
    } catch (error) {
        console.error('Error sending verification email:', error);
    }
};

const verifyConnection = async () => {
    // API Check: Simplemente verificamos que tengamos la Key
    if (!process.env.BREVO_API_KEY) {
        throw new Error('BREVO_API_KEY missing');
    }
    // Podríamos hacer una llamada dummy a la API de account, pero por ahora basta
    return true;
};

const sendTestEmail = async (targetEmail) => {
    return sendEmailViaAPI({
        to: targetEmail,
        subject: "Test de Configuración Railway (API)",
        htmlContent: "<h1>Funciona!</h1><p>Si lees esto, la API de Brevo está funcionando correctamente (puerto 443).</p>"
    });
};

module.exports = { sendNewRequestNotification, sendVerificationEmail, verifyConnection, sendTestEmail };
