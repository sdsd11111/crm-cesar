import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { interactions, contacts, discoveryLeads, whatsappLogs } from '@/lib/db/schema';
import { sql, eq } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

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
        console.log('🏁 WEBHOOK ENTRY POINT - Raw Body:', JSON.stringify(body).slice(0, 200));

        // 0. CAPTURA TÉCNICA INICIAL
        try {
            await db.insert(whatsappLogs).values({
                trigger: 'webhook_raw_receive',
                content: `Event: ${body.object || body.field || 'unknown'}`,
                status: 'processing',
                metadata: { raw: body }
            });
        } catch (e) {
            console.error('Raw Log Error:', e);
        }

        // 1. Extraer Valores
        const entry = body.entry?.[0];
        const change = entry?.changes?.[0] || (body.field === 'messages' ? body : null);
        const value = change?.value;

        if (value?.statuses) {
            return NextResponse.json({ status: 'ignored_status_update' });
        }

        const message = value?.messages?.[0];

        if (message) {
            const from = message.from;
            let content = '';
            let mediaData = null;

            if (message.type === 'text') {
                content = message.text?.body || '';
            } else if (['image', 'video', 'audio', 'voice', 'document'].includes(message.type)) {
                mediaData = message[message.type];
                const caption = mediaData.caption ? `: ${mediaData.caption}` : '';
                content = `[Multimedia: ${message.type}${caption}]`;
            } else {
                content = `[Mensaje de tipo ${message.type}]`;
            }

            console.log(`📩 [WEBHOOK_PARSE] From ${from}: ${content}`);

            // 2. Identify Sender
            try {
                let contactId = null;
                let discoveryLeadId = null;

                const cleanFrom = from.replace(/\D/g, '');
                const last9 = cleanFrom.slice(-9);

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
                            console.log(`👤 Webhook: unknown number ${from} - GHOST CHAT`);
                        }
                    }
                }

                // 3. Save Interaction
                await db.insert(interactions).values({
                    type: 'whatsapp',
                    direction: 'inbound',
                    content: content,
                    contactId: contactId,
                    discoveryLeadId: discoveryLeadId,
                    metadata: {
                        raw: message,
                        phoneNumber: from,
                        isGhost: !contactId && !discoveryLeadId,
                        media: mediaData ? { type: message.type, ...mediaData } : null
                    },
                    performedAt: new Date(),
                    createdAt: new Date()
                });

                console.log('✅ Webhook: Interaction saved successfully');
            } catch (dbError: any) {
                console.error('⚠️ Webhook DB Error:', dbError.message);
            }
            return NextResponse.json({ status: 'processed' });
        }

        return NextResponse.json({ status: 'no_message_data', received: !!body });
    } catch (error: any) {
        console.error('❌ Webhook error:', error.message);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
