import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { contacts, donnaChatMessages } from '@/lib/db/schema';
import { desc, eq, and, sql, gt } from 'drizzle-orm';

export async function GET(request: Request) {
    try {
        // Fetch all active conversations
        const allConversations = await db.select()
            .from(contacts)
            .where(
                and(
                    sql`${contacts.phone} IS NOT NULL`,
                    sql`${contacts.lastActivityAt} IS NOT NULL`
                )
            )
            .orderBy(desc(contacts.lastActivityAt))
            .limit(200);

        // Get last message for each contact
        const conversationsWithLastMessage = await Promise.all(
            allConversations.map(async (contact) => {
                const [lastMsg] = await db.select({
                    content: donnaChatMessages.content,
                    timestamp: donnaChatMessages.messageTimestamp,
                    role: donnaChatMessages.role,
                })
                    .from(donnaChatMessages)
                    .where(eq(donnaChatMessages.chatId, contact.phone!))
                    .orderBy(desc(donnaChatMessages.messageTimestamp))
                    .limit(1);

                return {
                    ...contact,
                    contactName: contact.contactName || contact.businessName || 'Sin nombre',
                    lastMessage: lastMsg?.content || '',
                    lastMessageTime: lastMsg?.timestamp || contact.lastActivityAt,
                    lastMessageRole: lastMsg?.role || 'user',
                };
            })
        );

        // Group conversations by Kanban column
        const now = new Date();
        const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000);

        const grouped = {
            entrada: conversationsWithLastMessage.filter(c =>
                c.botMode === 'active' &&
                (c.unreadCount || 0) > 0 &&
                c.lastMessageRole === 'user'
            ),
            donna: conversationsWithLastMessage.filter(c =>
                c.botMode === 'active' &&
                c.lastActivityAt &&
                new Date(c.lastActivityAt) > fiveMinutesAgo &&
                c.lastMessageRole === 'assistant' &&
                (c.unreadCount || 0) === 0
            ),
            intervencion: conversationsWithLastMessage.filter(c =>
                c.botMode === 'paused'
            ),
            finalizados: conversationsWithLastMessage.filter(c =>
                c.botMode === 'disabled' ||
                (c.lastActivityAt && new Date(c.lastActivityAt) < new Date(now.getTime() - 24 * 60 * 60 * 1000))
            ),
        };

        return NextResponse.json(grouped);

    } catch (error: any) {
        console.error('Error fetching kanban data:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function PATCH(request: Request) {
    try {
        const { contactId, column } = await request.json();

        // Map column to database fields
        const updates: any = {};

        switch (column) {
            case 'entrada':
                updates.botMode = 'active';
                updates.unreadCount = sql`${contacts.unreadCount} + 1`;
                break;
            case 'donna':
                updates.botMode = 'active';
                updates.unreadCount = 0;
                break;
            case 'intervencion':
                updates.botMode = 'paused';
                break;
            case 'finalizados':
                updates.botMode = 'disabled';
                updates.unreadCount = 0;
                break;
        }

        await db.update(contacts)
            .set({ ...updates, updatedAt: new Date() })
            .where(eq(contacts.id, contactId));

        return NextResponse.json({ success: true });

    } catch (error: any) {
        console.error('Error updating kanban status:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
