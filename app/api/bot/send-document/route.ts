import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import * as schema from '@/lib/db/schema';
import { verifyBotAuth } from '@/lib/bot-auth';
import { pdfDocumentService } from '@/lib/donna/services/PdfDocumentService';
import { whatsappService } from '@/lib/whatsapp/WhatsAppService';

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
            console.error('[BotAPI] Error generando PDF:', error);
            return NextResponse.json({ error: 'Error al generar el PDF desde Markdown.', details: error.message }, { status: 500 });
        }

        // 4. Subir a Meta (WhatsApp)
        let mediaId;
        try {
            const uploadResult = await whatsappService.uploadMedia(pdfBuffer, 'Documento.pdf', 'application/pdf', 'document');
            if (!uploadResult.success) {
                throw new Error(uploadResult.error || 'Upload failed sin error específico');
            }
            mediaId = uploadResult.mediaId;
        } catch (error: any) {
            console.error('[BotAPI] Error subiendo PDF a WhatsApp:', error);
            return NextResponse.json({ error: 'Error al subir el PDF a los servidores de WhatsApp.', details: error.message }, { status: 500 });
        }

        // 5. Enviar mensaje de WhatsApp
        const messageText = body.messageText || (
            documentType === 'quotation' ? 'Te adjuntamos la propuesta solicitada.' :
                documentType === 'contract' ? 'Te adjuntamos el borrador del contrato.' :
                    'Te adjuntamos el documento solicitado.'
        );
        const fileName = body.title ? `${body.title.replace(/[^a-z0-9]/gi, '_')}.pdf` : 'Documento.pdf';

        const sendResult = await whatsappService.sendMessage(body.phone, messageText, { source: 'donna_bot_document' }, {
            type: 'document',
            id: mediaId,
            filename: fileName
        });

        if (!sendResult.success) {
            console.error('[BotAPI] Error enviando WhatsApp:', sendResult);
            return NextResponse.json({ error: 'Error al enviar el PDF por WhatsApp.', details: sendResult.error }, { status: 500 });
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
                status: 'sent', // Asumimos enviado
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
                    whatsappMessageId: sendResult.data?.messages?.[0]?.id,
                    fileName,
                    record: createdRecord
                }
            },
            { status: 200 }
        );

    } catch (error) {
        const msg = error instanceof Error ? error.message : 'Unknown error';
        console.error('[BotAPI] Error crítico al procesar el envío de documento:', msg);
        return NextResponse.json(
            { error: 'Error interno al procesar el envío del documento.', details: msg },
            { status: 500 }
        );
    }
}
