import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import * as schema from '@/lib/db/schema';
import { verifyBotAuth } from '@/lib/bot-auth';

/**
 * POST /api/bot/contracts
 *
 * Endpoint receptor para que el bot Donna registre contratos en el CRM.
 * Autenticación: Authorization: Bearer <DONNA_API_SECRET>
 *
 * Body JSON:
 * {
 *   "title": "string (requerido)",
 *   "clientId": "uuid (opcional, pero recomendado)",
 *   "leadId": "uuid (opcional)",
 *   "status": "draft|pending_signature|signed|void (opcional, default: draft)",
 *   "contractData": { ... } (objeto con los datos del contrato, se serializa a JSON),
 *   "notes": "string (opcional)"
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

        // 3. Serializar contractData si viene como objeto
        let contractData = body.contractData ?? null;
        if (contractData && typeof contractData === 'object') {
            contractData = JSON.stringify(contractData);
        }

        // 4. Insertar en la tabla contracts
        const [newContract] = await db
            .insert(schema.contracts)
            .values({
                clientId: body.clientId ?? null,
                leadId: body.leadId ?? null,
                title: body.title,
                status: body.status ?? 'draft',
                contractData: contractData,
                notes: body.notes ?? null,
            })
            .returning();

        console.log(`[BotAPI] Contrato creado: ${newContract.id} para clientId: ${body.clientId}`);

        return NextResponse.json(
            { success: true, data: newContract },
            { status: 201 }
        );
    } catch (error) {
        const msg = error instanceof Error ? error.message : 'Unknown error';
        console.error('[BotAPI] Error al crear contrato:', msg);
        return NextResponse.json(
            { error: 'Error interno al registrar el contrato.', details: msg },
            { status: 500 }
        );
    }
}
