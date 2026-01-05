import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { interactions, contacts, discoveryLeads } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import axios from 'axios';

// VERIFICATION (GET)
export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);
    const mode = searchParams.get('hub.mode');
    const token = searchParams.get('hub.verify_token');
    const challenge = searchParams.get('hub.challenge');

    const VERIFY_TOKEN = process.env.META_WA_VERIFY_TOKEN;

    if (mode && token) {
        if (mode === 'subscribe' && token === VERIFY_TOKEN) {
            console.log('✅ WEBHOOK_VERIFIED');
            return new NextResponse(challenge, { status: 200 });
        } else {
            return new NextResponse('Forbidden', { status: 403 });
        }
    }
    return new NextResponse('Bad Request', { status: 400 });
}

// INCOMING MESSAGES (POST)
export async function POST(req: Request) {
    try {
        const body = await req.json();

        // Check if it's a WhatsApp Status Update (ignore for now to reduce noise)
        if (body.entry?.[0]?.changes?.[0]?.value?.statuses) {
            return NextResponse.json({ status: 'ignored_status_update' });
        }

        // Handle Messages
        if (body.object) {
            if (
                body.entry &&
                body.entry[0].changes &&
                body.entry[0].changes[0] &&
                body.entry[0].changes[0].value.messages &&
                body.entry[0].changes[0].value.messages[0]
            ) {
                const message = body.entry[0].changes[0].value.messages[0];
                const from = message.from; // Phone number
                const text = message.text?.body || '[Multimedia/No text]';
                const type = message.type;
                const timestamp = new Date();

                console.log(`📩 Incoming WhatsApp from ${from}: ${text}`);

                // 1. Identify Sender (Contact or Discovery Lead)
                let contactId = null;
                let discoveryLeadId = null;

                // Normalize phone (remove 593 or +) usually Meta sends raw country code
                // Our DB stores simple numbers or with 593. Let's try exact match first

                // Try finding in Contacts
                const [foundContact] = await db.select().from(contacts).where(eq(contacts.phone, from)).limit(1);

                if (foundContact) {
                    contactId = foundContact.id;
                } else {
                    // Try finding in Discovery Leads
                    const [foundLead] = await db.select().from(discoveryLeads).where(eq(discoveryLeads.telefonoPrincipal, from)).limit(1);
                    if (foundLead) {
                        discoveryLeadId = foundLead.id;
                    } else {
                        // 1.c Auto-create Prospect (Ghost Contact)
                        // This ensures the user SEES the message in the inbox
                        console.log(`👤 Creating new Prospect for unknown WhatsApp: ${from}`);
                        const [newContact] = await db.insert(contacts).values({
                            businessName: `WhatsApp ${from.slice(-4)}`,
                            contactName: 'Desconocido (WhatsApp)',
                            phone: from,
                            entityType: 'prospect',
                            source: 'whatsapp_inbound',
                            status: 'sin_contacto',
                            outreachStatus: 'new'
                        }).returning(); // Drizzle returning() to get ID

                        if (newContact) {
                            contactId = newContact.id;
                        }
                    }
                }

                // 2. Save Interaction (Now guaranteed to have an ID)
                if (contactId || discoveryLeadId) {
                    await db.insert(interactions).values({
                        contactId: contactId,
                        discoveryLeadId: discoveryLeadId,
                        type: 'whatsapp',
                        content: text,
                        direction: 'inbound',
                        performedAt: timestamp,
                        createdAt: timestamp
                    });
                    console.log('✅ Interaction saved to DB');
                }
            }
            return NextResponse.json({ status: 'processed' });
        } else {
            return new NextResponse('Not Found', { status: 404 });
        }
    } catch (error: any) {
        console.error('❌ Error processing webhook:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
