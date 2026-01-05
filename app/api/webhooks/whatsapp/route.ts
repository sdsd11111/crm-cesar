import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { interactions, contacts, discoveryLeads } from '@/lib/db/schema';
import { sql, eq } from 'drizzle-orm';
import { waTempStore } from '@/lib/whatsapp/temp-store';

// VERIFICATION (GET)
export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);
    const mode = searchParams.get('hub.mode');
    const token = searchParams.get('hub.verify_token');
    const challenge = searchParams.get('hub.challenge');

    const VERIFY_TOKEN = process.env.META_WA_VERIFY_TOKEN;

    if (mode && token) {
        if (mode === 'subscribe' && token === VERIFY_TOKEN) {
            console.log('✅ WEBHOOK_VERIFIED (Active Route)');
            return new NextResponse(challenge, { status: 200 });
        } else {
            console.warn('❌ WEBHOOK_VERIFICATION_FAILED: Token Mismatch');
            return new NextResponse('Forbidden', { status: 403 });
        }
    }
    return new NextResponse('Bad Request', { status: 400 });
}

// INCOMING MESSAGES (POST)
export async function POST(req: Request) {
    try {
        const body = await req.json();

        // Check if it's a WhatsApp Status Update
        if (body.entry?.[0]?.changes?.[0]?.value?.statuses) {
            return NextResponse.json({ status: 'ignored_status_update' });
        }

        // Handle Messages
        if (body.object) {
            const entry = body.entry?.[0];
            const change = entry?.changes?.[0];
            const value = change?.value;
            const message = value?.messages?.[0];

            if (message) {
                const from = message.from;
                const timestamp = new Date();

                // Log the full body for debugging in production logs
                console.log(`[WA_WEBHOOK_PAYLOAD]: ${JSON.stringify(body)}`);

                let content = '';
                let mediaData = null;

                // 1. Detect Content Type
                if (message.type === 'text') {
                    content = message.text?.body || '';
                } else if (['image', 'video', 'audio', 'voice', 'document'].includes(message.type)) {
                    mediaData = message[message.type];
                    const caption = mediaData.caption ? `: ${mediaData.caption}` : '';
                    content = `[Multimedia: ${message.type}${caption}]`;
                } else {
                    content = `[Mensaje de tipo ${message.type}]`;
                }

                console.log(`📩 [WEBHOOK] Incoming from ${from}: ${content}`);

                // [BYPASS] Add to Temp Store immediately
                waTempStore.addLog({
                    type: 'whatsapp',
                    direction: 'inbound',
                    content: content,
                    performedAt: timestamp.toISOString(),
                    metadata: {
                        raw: message,
                        media: mediaData ? { type: message.type, ...mediaData } : null
                    }
                });

                // 2. Identify Sender (Robust Match) - Wrapped in Try/Catch for DB independence
                try {
                    let contactId = null;
                    let discoveryLeadId = null;

                    const cleanFrom = from.replace(/\D/g, '');
                    const last9 = cleanFrom.slice(-9);

                    // Try Exact Match first
                    const [exactContact] = await db.select().from(contacts)
                        .where(eq(contacts.phone, from))
                        .limit(1);

                    if (exactContact) {
                        contactId = exactContact.id;
                    } else {
                        const [foundContact] = await db.select().from(contacts)
                            .where(sql`${contacts.phone} LIKE ${'%' + last9}`)
                            .limit(1);

                        if (foundContact) {
                            contactId = foundContact.id;
                        } else {
                            const [foundLead] = await db.select().from(discoveryLeads)
                                .where(sql`${discoveryLeads.telefonoPrincipal} LIKE ${'%' + last9}`)
                                .limit(1);

                            if (foundLead) {
                                discoveryLeadId = foundLead.id;
                            } else {
                                console.log(`👤 Webhook: Creating new Prospect for unknown number: ${from}`);
                                const [newContact] = await db.insert(contacts).values({
                                    businessName: `WhatsApp ${from.slice(-4)}`,
                                    contactName: 'Nuevo Contacto (WhatsApp)',
                                    phone: from,
                                    entityType: 'prospect',
                                    source: 'whatsapp_inbound',
                                    status: 'sin_contacto',
                                    outreachStatus: 'new'
                                }).returning();
                                contactId = newContact?.id || null;
                            }
                        }
                    }

                    // 3. Save Interaction
                    await db.insert(interactions).values({
                        contactId: contactId,
                        discoveryLeadId: discoveryLeadId,
                        type: 'whatsapp',
                        content: content,
                        direction: 'inbound',
                        performedAt: timestamp,
                        createdAt: timestamp,
                        metadata: {
                            raw: message,
                            media: mediaData ? { type: message.type, ...mediaData } : null
                        }
                    });
                    console.log('✅ Webhook: Interaction saved to DB');
                } catch (dbError: any) {
                    console.error('⚠️ Webhook DB Error (Ignored for Bypass):', dbError.message);
                }
            }
            return NextResponse.json({ status: 'processed' });
        }
        return new NextResponse('Not Found', { status: 404 });
    } catch (error: any) {
        console.error('❌ Webhook error:', error.message);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
