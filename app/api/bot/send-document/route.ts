import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import * as schema from '@/lib/db/schema';
import { verifyBotAuth } from '@/lib/bot-auth';
import { pdfDocumentService } from '@/lib/donna/services/PdfDocumentService';
import { whatsappService } from '@/lib/whatsapp/WhatsAppService';

export const maxDuration = 60; // Aumentar timeout a 60s para generación de PDF y envío

/**
 * POST /api/bot/send-document
 *
 * Endpoint receptor para que Donna genere un PDF a partir de Markdown 
 * y lo envíe por WhatsApp en un solo paso.
 * Autenticación: Authorization: Bearer <DONNA_API_SECRET>
 *
 * Body JSON:
 * {
 *   "phone": "593966410409 (requerido)",
 *   "content": "# Markdown completo (requerido)",
 *   "documentType": "quotation|contract|generic (opcional, default: generic)",
 *   "messageText": "string (opcional: Texto acompañando al PDF en WhatsApp)",
 *   "title": "string (opcional: Para nombrar el archivo y guardar en BD)",
 * 
 *   // Campos opcionales para guardar en la BD del CRM:
 *   "leadId": "uuid",
 *   "clientId": "uuid",
 *   "introduction": "string",
 *   "valueProposition": "string",
 *   "roiClosing": "string",
 *   "mentalTrigger": "string",
 *   "selectedServices": ["A", "B"],
 *   "totalAmount": 1500.00,
 *   "contractData": {}
 * }
 */
export async function POST(request: Request) {
    // 1. Verificar autenticación del bot
    const authError = verifyBotAuth(request);
    if (authError) return authError;

    try {
        const body = await request.json();

        // 2. Validar campos obligatorios
        if (!body.phone || !body.content) {
            return NextResponse.json(
                { error: 'Los campos "phone" y "content" son obligatorios.' },
                { status: 400 }
            );
        }

        const documentType = body.documentType || 'generic';

        // 3. Generar PDF en Buffer
        let pdfBuffer;
        try {
            pdfBuffer = await pdfDocumentService.generatePdf(body.content, documentType, {
                clientName: body.clientName,
                signerName: body.signerName
            });
        } catch (error: any) {
            console.error('❌ [BotAPI] Error crítico en generación de PDF:', error);
            return NextResponse.json({
                error: 'Error al generar el PDF.',
                details: error.message,
                stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
            }, { status: 500 });
        }

        // 4. Send Document via MessagingService (Platform agnostic)
        const platform = body.platform || 'whatsapp';
        const messageText = body.messageText || (
            documentType === 'quotation' ? 'Te adjuntamos la propuesta solicitada.' :
                documentType === 'contract' ? 'Te adjuntamos el borrador del contrato.' :
                    'Te adjuntamos el documento solicitado.'
        );
        const fileName = body.title ? `${body.title.replace(/[^a-z0-9]/gi, '_')}.pdf` : 'Documento.pdf';

        const { messagingService } = await import('@/lib/messaging/MessagingService');
        const sendResult = await messagingService.sendDocument(body.phone, pdfBuffer, fileName, messageText, {
            platform,
            source: 'donna_bot_document'
        });

        if (!sendResult.success) {
            console.error('[BotAPI] Error sending document:', sendResult);
            return NextResponse.json({ error: 'Error al enviar el documento.', details: sendResult.error }, { status: 500 });
        }

        // 6. (Opcional) Guardar registro en la Base de Datos si hay contexto
        let createdRecord = null;
        if (body.leadId && body.title && documentType === 'quotation') {
            const [newQuotation] = await db.insert(schema.quotations).values({
                leadId: body.leadId,
                title: body.title,
                status: 'sent', // Ya fue enviado por WhatsApp
                introduction: body.introduction || null,
                valueProposition: body.valueProposition || null,
                roiClosing: body.roiClosing || null,
                mentalTrigger: body.mentalTrigger || null,
                selectedServices: body.selectedServices ? JSON.stringify(body.selectedServices) : '[]',
                totalAmount: body.totalAmount ?? null,
                createdBy: 'Donna',
            }).returning();
            createdRecord = newQuotation;
            console.log(`[BotAPI] Cotización CRM guardada: ${newQuotation.id}`);
        } else if (body.clientId && body.title && documentType === 'contract') {
            const [newContract] = await db.insert(schema.contracts).values({
                title: body.title,
                clientId: body.clientId,
                leadId: body.leadId || null,
                status: 'pending_signature', // Asumimos enviado y pendiente de firma
                contractData: body.contractData ? JSON.stringify(body.contractData) : '{}',
                notes: 'Generado y enviado por Donna vía WhatsApp',
            }).returning();
            createdRecord = newContract;
            console.log(`[BotAPI] Contrato CRM guardado: ${newContract.id}`);
        }

        return NextResponse.json(
            {
                success: true,
                message: 'Documento generado en PDF y enviado exitosamente por WhatsApp.',
                data: {
                    whatsappMessageId: sendResult.data?.id || sendResult.data?.messages?.[0]?.id || sendResult.data?.message_id,
                    telegramMessageId: sendResult.data?.message_id,
                    fileName,
                    record: createdRecord
                }
            },
            { status: 200 }
        );

    } catch (error) {
        const msg = error instanceof Error ? error.message : 'Unknown error';
        console.error('❌ [BotAPI] ERROR CRÍTICO NO CONTROLADO:', error);
        return NextResponse.json(
            {
                error: 'Error interno del servidor en el endpoint de documentos.',
                details: msg,
                stack: process.env.NODE_ENV === 'development' ? (error as Error).stack : undefined
            },
            { status: 500 }
        );
    }
}
