import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import * as schema from '@/lib/db/schema';
import { verifyBotAuth } from '@/lib/bot-auth';
import { ilike, or } from 'drizzle-orm';

/**
 * GET /api/bot/leads?q=Name
 * Busca un lead por nombre
 */
export async function GET(request: Request) {
    const authError = verifyBotAuth(request);
    if (authError) return authError;

    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');

    if (!query) {
        return NextResponse.json({ error: 'Falta parámetro q' }, { status: 400 });
    }

    try {
        const results = await db.select().from(schema.contacts)
            .where(
                or(
                    ilike(schema.contacts.contactName, `%${query}%`),
                    ilike(schema.contacts.businessName, `%${query}%`)
                )
            )
            .limit(5);

        return NextResponse.json({ data: results }, { status: 200 });
    } catch (error: any) {
        console.error('Error searching leads:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

/**
 * POST /api/bot/leads
 * Crea un lead
 */
export async function POST(request: Request) {
    const authError = verifyBotAuth(request);
    if (authError) return authError;

    try {
        const body = await request.json();

        // 1. Insert into contacts table (formerly leads)
        const [newContact] = await db.insert(schema.contacts).values({
            contactName: body.name,
            businessName: body.company || null,
            phone: body.phone || null,
            email: body.email || null,
            notes: body.notes || 'Creado por Donna Bot',
            status: body.status || 'primer_contacto',
            source: body.source || 'donna_bot',
            entityType: 'lead',
        }).returning();

        // 2. Insert into contactChannels
        if (body.phone) {
            try {
                // Ensure no duplicate insertion issue by doing an upsert or checking
                await db.insert(schema.contactChannels).values({
                    contactId: newContact.id,
                    platform: 'whatsapp',
                    identifier: body.phone,
                    isPrimary: true
                });
            } catch (e) {
                console.warn('Could not insert contact channel:', e);
            }
        }

        return NextResponse.json({
            success: true,
            data: { id: newContact.id },
            message: 'Lead creado'
        }, { status: 201 });
    } catch (error: any) {
        console.error('Error creating lead:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
