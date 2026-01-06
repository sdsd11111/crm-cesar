
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { contacts, donnaChatMessages } from '@/lib/db/schema';
import { desc, eq, sql } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const limit = parseInt(searchParams.get('limit') || '50');
        const search = searchParams.get('search') || '';

        const activeContacts = await db.query.contacts.findMany({
            where: (contacts, { ilike, or, and, isNotNull }) => {
                const conditions = [isNotNull(contacts.lastActivityAt)];

                if (search) {
                    conditions.push(
                        or(
                            ilike(contacts.contactName, `%${search}%`),
                            ilike(contacts.phone || '', `%${search}%`)
                        )!
                    );
                }

                return and(...conditions);
            },
            orderBy: (contacts, { desc }) => [desc(contacts.lastActivityAt)],
            limit: limit,
            with: {
                // Optionally fetch the last message content if we can join efficiently
                // For now, frontend might fetch history separately or we add a subquery later.
                client: true // Fetch linked client info
            }
        });

        return NextResponse.json(activeContacts);

    } catch (error: any) {
        console.error('Error fetching conversations:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
