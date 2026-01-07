import { NextRequest, NextResponse } from 'next/server';
import nodemailer from 'nodemailer';
import { db } from '@/lib/db';
import { interactions } from '@/lib/db/schema';

// Configure SMTP transporter
const createTransporter = () => {
    const config = {
        host: process.env.SMTP_HOST || 'mail.cesarreyesjaramillo.com',
        port: parseInt(process.env.SMTP_PORT || '465'),
        secure: process.env.SMTP_SECURE === 'true' || true,
        auth: {
            user: process.env.SMTP_USER || 'turismo@cesarreyesjaramillo.com',
            pass: process.env.SMTP_PASSWORD || '',
        },
    };

    // Warn if using default password (empty)
    if (!process.env.SMTP_PASSWORD) {
        console.warn('⚠️ SMTP_PASSWORD not set in environment variables!');
    }

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

        // Send email
        const transporter = createTransporter();
        const info = await transporter.sendMail({
            from: `"${process.env.SMTP_FROM_NAME || 'César Reyes - Posicionamiento Real'}" <${process.env.SMTP_FROM_EMAIL || 'turismo@cesarreyesjaramillo.com'}>`,
            to: to,
            subject: subject,
            text: emailBody, // Plain text body
            html: emailBody.replace(/\n/g, '<br>'), // Simple HTML conversion
        });

        console.log('Email sent:', info.messageId);

        // Register interaction in database
        if (contactId || discoveryLeadId) {
            try {
                await db.insert(interactions).values({
                    type: 'email',
                    direction: 'outbound',
                    outcome: 'sent',
                    content: `Asunto: ${subject}\n\n${emailBody}`,
                    contactId: contactId || null,
                    discoveryLeadId: discoveryLeadId || null,
                    performedAt: new Date(),
                    metadata: template ? { template } : null,
                });
            } catch (dbError) {
                console.error('Error saving interaction:', dbError);
                // Don't fail the request if DB insert fails
            }
        }

        return NextResponse.json({
            success: true,
            messageId: info.messageId,
            message: 'Email enviado correctamente'
        });

    } catch (error: any) {
        console.error('Error sending email:', error);

        // Provide specific error messages based on error type
        let errorMessage = 'Error al enviar email';
        let errorDetails = error.message;

        if (error.code === 'EAUTH' || error.responseCode === 535) {
            errorMessage = 'Error de autenticación SMTP';
            errorDetails = 'Credenciales incorrectas. Verifica SMTP_USER y SMTP_PASSWORD en las variables de entorno.';
        } else if (error.code === 'ECONNECTION' || error.code === 'ETIMEDOUT') {
            errorMessage = 'Error de conexión al servidor SMTP';
            errorDetails = `No se pudo conectar a ${process.env.SMTP_HOST || 'mail.cesarreyesjaramillo.com'}:${process.env.SMTP_PORT || '465'}`;
        } else if (error.code === 'EMESSAGE') {
            errorMessage = 'Error en el formato del mensaje';
            errorDetails = error.message;
        }

        return NextResponse.json(
            {
                error: errorMessage,
                details: errorDetails,
                code: error.code,
                responseCode: error.responseCode
            },
            { status: 500 }
        );
    }
}
