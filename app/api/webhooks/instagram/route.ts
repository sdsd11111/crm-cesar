import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { sql, and, eq } from 'drizzle-orm';
import { contacts, contactChannels, interactions } from '@/lib/db/schema';

/**
 * Instagram Webhook Endpoint (Meta Graph API)
 */

// HANDLE VERIFICATION (GET)
export async function GET(req: NextRequest) {
    const params = req.nextUrl.searchParams;
    const mode = params.get('hub.mode');
    const token = params.get('hub.verify_token');
    const challenge = params.get('hub.challenge');

    const VERIFY_TOKEN = process.env.INSTAGRAM_VERIFY_TOKEN || 'objetivo_instagram_secret';

    if (mode === 'subscribe' && token === VERIFY_TOKEN) {
        console.log('✅ Instagram Webhook Verified');
        return new Response(challenge, { status: 200 });
    }

    return new Response('Forbidden', { status: 403 });
}

import { cortexRouter } from '@/lib/donna/services/CortexRouterService';

// HANDLE MESSAGES (POST)
export async function POST(req: NextRequest) {
    try {
        const body = await req.json();

        if (body.object !== 'instagram') {
            return NextResponse.json({ error: 'Not an instagram object' }, { status: 400 });
        }

        // Meta sends updates in a specific structure
        const entry = body.entry?.[0];
        const messagingEvent = entry?.messaging?.[0];

        // 1. Skip if it's NOT a message (e.g., read receipt) or if it's from the bot itself
        if (!messagingEvent?.message || messagingEvent.message.is_echo) {
            return NextResponse.json({ ok: true });
        }

        const senderId = messagingEvent.sender.id;
        const text = messagingEvent.message.text;

        console.log(`📸 Instagram message from ${senderId}: ${text}`);

        // 2. IDEMPOTENCY CHECK
        const messageId = messagingEvent.message.mid;
        if (messageId) {
            try {
                await db.execute(sql`
                    INSERT INTO "webhook_events_processed" ("provider", "external_id") 
                    VALUES ('instagram', ${String(messageId)})
                `);
            } catch (e) {
                console.warn(`[Instagram] Skipping duplicate message: ${messageId}`);
                return NextResponse.json({ ok: true });
            }
        }

        // 2.5 IDENTITY RESOLUTION & ACTIVITY
        let contactId = null;

        // A. Resolve via Channels
        const [channelMatch] = await db.select()
            .from(contactChannels)
            .where(and(eq(contactChannels.platform, 'instagram'), eq(contactChannels.identifier, senderId)))
            .limit(1);

        if (channelMatch) {
            contactId = channelMatch.contactId;
        } else {
            // B. Create Ghost Contact for Instagram
            try {
                const [newGhost] = await db.insert(contacts).values({
                    contactName: `IG_${senderId.slice(-4)}`,
                    status: 'lead',
                    source: 'instagram_inbound',
                    channelSource: 'instagram',
                    entityType: 'lead',
                    lastActivityAt: new Date(),
                    unreadCount: 1
                } as any).returning();

                contactId = newGhost.id;

                await db.insert(contactChannels).values({
                    contactId: newGhost.id,
                    platform: 'instagram',
                    identifier: senderId,
                    isPrimary: true
                });
            } catch (err) {
                console.error('Error creating IG ghost contact:', err);
            }
        }

        if (contactId && channelMatch) {
            // Update existing contact
            await db.update(contacts)
                .set({
                    lastActivityAt: new Date(),
                    unreadCount: sql`${contacts.unreadCount} + 1`,
                    updatedAt: new Date()
                } as any)
                .where(eq(contacts.id, contactId));
        }

        // 3. Save Interaction (Clinical History)
        await db.insert(interactions).values({
            type: 'instagram',
            direction: 'inbound',
            content: text,
            contactId: contactId,
            metadata: { platform: 'instagram', senderId },
            performedAt: new Date()
        });

        // 4. Process with Cortex Router
        await cortexRouter.processInput({
            text: text,
            source: 'client',
            chatId: senderId,
            contactId: contactId as any
        });

        return NextResponse.json({ ok: true });
    } catch (error) {
        console.error('❌ Instagram Webhook Error:', error);
        return NextResponse.json({ ok: true });
    }
}
