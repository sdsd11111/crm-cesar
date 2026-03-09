import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import * as schema from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { verifyBotAuth } from '@/lib/bot-auth';

// Valores válidos para el estado de un Lead/Contacto
const VALID_LEAD_STATUSES = [
    'sin_contacto',
    'primer_contacto',
    'segundo_contacto',
    'tercer_contacto',
    'cotizado',
    'convertido',
] as const;

type LeadStatus = typeof VALID_LEAD_STATUSES[number];

/**
 * PATCH /api/bot/leads/[id]/status
 *
 * Endpoint receptor para que el bot Donna actualice el estado de un Lead en el CRM.
 * Actualiza tanto la tabla `leads` como la tabla unificada `contacts`.
 * Autenticación: Authorization: Bearer <DONNA_API_SECRET>
 *
 * Body JSON:
 * {
 *   "status": "sin_contacto|primer_contacto|segundo_contacto|tercer_contacto|cotizado|convertido"
 * }
 */
export async function PATCH(
    request: Request,
    { params }: { params: { id: string } }
) {
    // 1. Verificar autenticación del bot
    const authError = verifyBotAuth(request);
    if (authError) return authError;

    const { id } = params;

    if (!id) {
        return NextResponse.json(
            { error: 'El parámetro "id" del lead es obligatorio en la URL.' },
            { status: 400 }
        );
    }

    try {
        const body = await request.json();
        const { status } = body;

        // 2. Validar que el status sea uno de los valores permitidos
        if (!status || !VALID_LEAD_STATUSES.includes(status as LeadStatus)) {
            return NextResponse.json(
                {
                    error: `El campo "status" es inválido. Valores permitidos: ${VALID_LEAD_STATUSES.join(', ')}`,
                },
                { status: 400 }
            );
        }

        const now = new Date();

        // 3. Actualizar tabla `leads`
        const [updatedLead] = await db
            .update(schema.leads)
            .set({ status: status as LeadStatus, updatedAt: now })
            .where(eq(schema.leads.id, id))
            .returning();

        if (!updatedLead) {
            return NextResponse.json(
                { error: `No se encontró un Lead con id: ${id}` },
                { status: 404 }
            );
        }

        // 4. Actualizar también la tabla `contacts` unificada (mismo id)
        await db
            .update(schema.contacts)
            .set({ status: status, updatedAt: now })
            .where(eq(schema.contacts.id, id));

        console.log(`[BotAPI] Estado del Lead ${id} actualizado a: ${status}`);

        return NextResponse.json({
            success: true,
            message: `Estado del Lead actualizado a "${status}".`,
            data: updatedLead,
        });
    } catch (error) {
        const msg = error instanceof Error ? error.message : 'Unknown error';
        console.error('[BotAPI] Error al actualizar estado del lead:', msg);
        return NextResponse.json(
            { error: 'Error interno al actualizar el estado del lead.', details: msg },
            { status: 500 }
        );
    }
}
