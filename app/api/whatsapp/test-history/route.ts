import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { interactions } from '@/lib/db/schema';
import { desc, eq, or } from 'drizzle-orm';

export async function GET() {
    try {
        const rawLogs = await db.select()
            .from(interactions)
            .where(eq(interactions.type, 'whatsapp'))
            .orderBy(desc(interactions.createdAt))
            .limit(50);

        return NextResponse.json({ success: true, logs: rawLogs });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
