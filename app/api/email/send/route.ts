import { NextRequest, NextResponse } from 'next/server';
import nodemailer from 'nodemailer';
import { db } from '@/lib/db';
import { interactions } from '@/lib/db/schema';

// Configure SMTP transporter
const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'mail.cesarreyesjaramillo.com',
    port: parseInt(process.env.SMTP_PORT || '465'),
    secure: process.env.SMTP_SECURE === 'true' || true, // true for 465, false for other ports
    auth: {
        user: process.env.SMTP_USER || 'turismo@cesarreyesjaramillo.com',
        pass: process.env.SMTP_PASSWORD || '',
    },
});

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
        return NextResponse.json(
            {
                error: 'Error al enviar email',
                details: error.message
            },
            { status: 500 }
        );
    }
}
