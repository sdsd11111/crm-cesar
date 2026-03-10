import { NextRequest, NextResponse } from 'next/server';
import nodemailer from 'nodemailer';
import { db } from '@/lib/db';
import { interactions } from '@/lib/db/schema';
import { wrapEmailHTML } from '@/lib/templates/signature';

// Configure SMTP transporter with strict validation
const createTransporter = () => {
    // Validate required SMTP environment variables
    const requiredVars = {
        SMTP_HOST: process.env.SMTP_HOST,
        SMTP_PORT: process.env.SMTP_PORT,
        SMTP_USER: process.env.SMTP_USER,
        SMTP_PASSWORD: process.env.SMTP_PASSWORD,
    };

    const missing = Object.entries(requiredVars)
        .filter(([_, value]) => !value)
        .map(([key]) => key);

    if (missing.length > 0) {
        const error = `Missing required SMTP environment variables: ${missing.join(', ')}`;
        console.error('❌ SMTP Configuration Error:', error);
        throw new Error(error);
    }

    const config = {
        host: process.env.SMTP_HOST!,
        port: parseInt(process.env.SMTP_PORT!),
        secure: process.env.SMTP_SECURE === 'true',
        auth: {
            user: process.env.SMTP_USER!,
            pass: process.env.SMTP_PASSWORD!,
        },
        // Add connection timeout
        connectionTimeout: 10000, // 10 seconds
        // Add socket timeout
        socketTimeout: 10000,
    };

    console.log('📧 SMTP Configuration:', {
        host: config.host,
        port: config.port,
        secure: config.secure,
        user: config.auth.user,
        passwordSet: !!config.auth.pass,
    });

    return nodemailer.createTransport(config);
};

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { to, subject, body: emailBody, contactId, discoveryLeadId, template } = body;

        // Validation
        if (!to || !subject || !emailBody) {
            return NextResponse.json(
                { error: 'Faltan campos requeridos: to, subject, body' },
                { status: 400 }
            );
        }

        // Email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(to)) {
            return NextResponse.json(
                { error: 'Email destino no es válido' },
                { status: 400 }
            );
        }

        // Create transporter and verify connection
        console.log('📤 Attempting to send email to:', to);
        const transporter = createTransporter();

        // Verify SMTP connection before sending
        try {
            await transporter.verify();
            console.log('✅ SMTP connection verified successfully');
        } catch (verifyError: any) {
            console.error('❌ SMTP verification failed:', verifyError);
            throw new Error(`SMTP connection failed: ${verifyError.message}`);
        }

        // Send email with HTML template
        const htmlContent = wrapEmailHTML(emailBody);

        const mailOptions = {
            from: `"${process.env.SMTP_FROM_NAME || 'César Reyes - Posicionamiento Real'}" <${process.env.SMTP_FROM_EMAIL || 'turismo@cesarreyesjaramillo.com'}>`,
            to: to,
            subject: subject,
            text: emailBody.replace(/<[^>]*>/g, ''), // Plain text fallback (strip HTML)
            html: htmlContent, // Professional HTML email with signature
        };

        console.log('📧 Sending email with options:', {
            from: mailOptions.from,
            to: mailOptions.to,
            subject: mailOptions.subject,
        });

        const info = await transporter.sendMail(mailOptions);

        console.log('✅ Email sent successfully:', {
            messageId: info.messageId,
            response: info.response,
            accepted: info.accepted,
            rejected: info.rejected,
        });

        // Register interaction in database
        // Always log sent emails (removed conditional)
        try {
            await db.insert(interactions).values({
                type: 'email',
                direction: 'outbound',
                outcome: 'sent',
                content: `Asunto: ${subject}\n\n${emailBody}`,
                contactId: contactId || null,
                discoveryLeadId: discoveryLeadId || null,
                performedAt: new Date(),
                metadata: template ? { template, to, messageId: info.messageId } : { to, messageId: info.messageId },
            });
            console.log('✅ Interaction saved to database:', {
                type: 'email',
                to,
                contactId: contactId || 'none',
                discoveryLeadId: discoveryLeadId || 'none',
            });
        } catch (dbError) {
            console.error('❌ Error saving interaction to database:', dbError);
            // Don't fail the request if DB insert fails
        }


        return NextResponse.json({
            success: true,
            messageId: info.messageId,
            message: 'Email enviado correctamente'
        });

    } catch (error: any) {
        console.error('❌ Error sending email:', {
            message: error.message,
            code: error.code,
            responseCode: error.responseCode,
            command: error.command,
            stack: error.stack,
        });

        // Provide specific error messages based on error type
        let errorMessage = 'Error al enviar email';
        let errorDetails = error.message;

        if (error.message?.includes('Missing required SMTP')) {
            errorMessage = 'Configuración SMTP incompleta';
            errorDetails = error.message;
        } else if (error.message?.includes('SMTP connection failed')) {
            errorMessage = 'Error de conexión SMTP';
            errorDetails = error.message;
        } else if (error.code === 'EAUTH' || error.responseCode === 535) {
            errorMessage = 'Error de autenticación SMTP';
            errorDetails = 'Credenciales incorrectas. Verifica SMTP_USER y SMTP_PASSWORD en las variables de entorno.';
        } else if (error.code === 'ECONNECTION' || error.code === 'ETIMEDOUT') {
            errorMessage = 'Error de conexión al servidor SMTP';
            errorDetails = `No se pudo conectar a ${process.env.SMTP_HOST}:${process.env.SMTP_PORT}`;
        } else if (error.code === 'EMESSAGE') {
            errorMessage = 'Error en el formato del mensaje';
            errorDetails = error.message;
        } else if (error.code === 'EENVELOPE') {
            errorMessage = 'Error en las direcciones de email';
            errorDetails = 'Verifica que las direcciones de email sean válidas';
        }

        return NextResponse.json(
            {
                error: errorMessage,
                details: errorDetails,
                code: error.code,
                responseCode: error.responseCode,
                success: false,
            },
            { status: 500 }
        );
    }
}
