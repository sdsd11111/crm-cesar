import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { sql } from 'drizzle-orm';

export async function GET() {
    try {
        const result = await db.execute(sql`
            SELECT COUNT(*) as count
            FROM (
                SELECT DISTINCT ON (COALESCE(contact_id, discovery_lead_id)) 
                    direction 
                FROM interactions 
                WHERE type = 'whatsapp'
                ORDER BY COALESCE(contact_id, discovery_lead_id), performed_at DESC
            ) as sub 
            WHERE direction = 'inbound'
        `);

        // result is an array of rows. access the first row's count.
        // Postgres returns BigInt for count, convert to number.
        const count = Number(result[0]?.count || 0);

        return NextResponse.json({ count });
    } catch (error: any) {
        console.error('Error counting unread messages:', error);
        return NextResponse.json({ count: 0 }, { status: 500 });
    }
}
