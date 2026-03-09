import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import * as schema from '@/lib/db/schema';
import { verifyBotAuth } from '@/lib/bot-auth';

/**
 * POST /api/bot/quotations
 *
 * Endpoint receptor para que el bot Donna registre cotizaciones en el CRM.
 * Autenticación: Authorization: Bearer <DONNA_API_SECRET>
 *
 * Body JSON:
 * {
 *   "leadId": "uuid (requerido)",
 *   "title": "string (requerido)",
 *   "status": "draft|sent|approved|rejected (opcional, default: draft)",
 *   "introduction": "string (opcional)",
 *   "valueProposition": "string (opcional)",
 *   "roiClosing": "string (opcional)",
 *   "mentalTrigger": "string (opcional)",
 *   "selectedServices": ["servicio A", "servicio B"] (opcional, se serializa a JSON string),
 *   "totalAmount": 1500.00 (número opcional)
 * }
 */
export async function POST(request: Request) {
    // 1. Verificar autenticación del bot
    const authError = verifyBotAuth(request);
    if (authError) return authError;

    try {
        const body = await request.json();

        // 2. Validar campos obligatorios
        if (!body.title) {
            return NextResponse.json(
                { error: 'El campo "title" es obligatorio.' },
                { status: 400 }
            );
        }

        // 3. Preparar selectedServices como JSON string si viene como array
        let selectedServices = body.selectedServices ?? '[]';
        if (Array.isArray(selectedServices)) {
            selectedServices = JSON.stringify(selectedServices);
        }

        // 4. Insertar en la tabla quotations
        const [newQuotation] = await db
            .insert(schema.quotations)
            .values({
                leadId: body.leadId ?? null,
                title: body.title,
                status: body.status ?? 'draft',
                introduction: body.introduction ?? null,
                valueProposition: body.valueProposition ?? null,
                roiClosing: body.roiClosing ?? null,
                mentalTrigger: body.mentalTrigger ?? null,
                selectedServices: selectedServices,
                totalAmount: body.totalAmount ?? null,
                createdBy: 'Donna',
            })
            .returning();

        console.log(`[BotAPI] Cotización creada: ${newQuotation.id} para leadId: ${body.leadId}`);

        return NextResponse.json(
            { success: true, data: newQuotation },
            { status: 201 }
        );
    } catch (error) {
        const msg = error instanceof Error ? error.message : 'Unknown error';
        console.error('[BotAPI] Error al crear cotización:', msg);
        return NextResponse.json(
            { error: 'Error interno al registrar la cotización.', details: msg },
            { status: 500 }
        );
    }
}
