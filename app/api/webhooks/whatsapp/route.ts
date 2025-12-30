import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { interactions, contacts, discoveryLeads } from '@/lib/db/schema';
import { like } from 'drizzle-orm';

/**
 * Endpoint for Evolution API Webhooks.
 * This ensures that EVERY message (sent or received) is logged in the CRM interactions history.
 */
/**
 * GET - Meta Webhook Verification (Handshake)
 */
export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);
    const mode = searchParams.get('hub.mode');
    const token = searchParams.get('hub.verify_token');
    const challenge = searchParams.get('hub.challenge');

    const verifyToken = process.env.META_WA_VERIFY_TOKEN || '';

    if (mode && token) {
        if (mode === 'subscribe' && token === verifyToken) {
            console.log('✅ Webhook Verified by Meta');
            return new Response(challenge, { status: 200 });
        } else {
            console.warn('❌ Webhook Verification Failed: Token mismatch');
            return new Response('Forbidden', { status: 403 });
        }
    }
    return new Response('Bad Request', { status: 400 });
}

/**
 * POST - Receive messages from Meta Cloud API
 */
export async function POST(req: Request) {
    try {
        const body = await req.json();

        // Check if it's a WhatsApp message event
        if (body.object === 'whatsapp_business_account') {
            const entry = body.entry?.[0];
            const change = entry?.changes?.[0];
            const value = change?.value;
            const messages = value?.messages;

            if (!messages || messages.length === 0) {
                return NextResponse.json({ success: true, reason: 'No messages' });
            }

            const msg = messages[0];
            const from = msg.from; // Phone number (sender)
            const msgId = msg.id;

            // Extract text based on type
            let text = '';
            if (msg.type === 'text') {
                text = msg.text?.body || '';
            } else if (msg.type === 'image') {
                text = `📸 Imagen: ${msg.image?.caption || 'Sin leyenda'}`;
            } else if (msg.type === 'button') {
                text = `🔘 Botón: ${msg.button?.text}`;
            } else {
                text = `[Mensaje tipo ${msg.type}]`;
            }

            if (!text) return NextResponse.json({ success: true, reason: 'Empty body' });

            console.log(`📩 [Meta Webhook] New message from ${from}: "${text}"`);

            // Phone extraction - Meta usually gives international format (e.g. 593982...)
            const last9 = from.slice(-9);

            // 1. MATCH CONTACT (CRM Master Table)
            const [contact] = await db.select().from(contacts)
                .where(like(contacts.phone, `%${last9}`))
                .limit(1);

            if (contact) {
                console.log(`✅ Webhook Sync: Linked to Contact [${contact.id}] ${contact.contactName}`);
                await db.insert(interactions).values({
                    contactId: contact.id,
                    type: 'whatsapp',
                    direction: 'inbound',
                    content: text,
                    performedAt: new Date(),
                });

                // PROACTIVE BRAIN: Trigger Donna Planning
                try {
                    const { planningEngine } = await import('@/lib/donna/services/PlanningEngine');
                    await planningEngine.generatePlanningForContact(contact.id);
                } catch (e) {
                    console.error('⚠️ Webhook: Planning Trigger Error:', e);
                }
            } else {
                // 2. FALLBACK: MATCH DISCOVERY LEAD
                const [discoveryLead] = await db.select().from(discoveryLeads)
                    .where(like(discoveryLeads.telefonoPrincipal, `%${last9}`))
                    .limit(1);

                if (discoveryLead) {
                    console.log(`✅ Webhook Sync: Linked to Discovery Lead [${discoveryLead.id}] ${discoveryLead.nombreComercial}`);
                    await db.insert(interactions).values({
                        discoveryLeadId: discoveryLead.id,
                        type: 'whatsapp',
                        direction: 'inbound',
                        content: text,
                        performedAt: new Date(),
                    });
                } else {
                    console.log(`ℹ️ Webhook Sync: Number ${from} not found in CRM.`);
                }
            }
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('❌ Meta Webhook Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
