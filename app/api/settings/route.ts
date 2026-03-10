
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { systemSettings } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const key = searchParams.get('key');

    if (!key) {
        return NextResponse.json({ error: 'Key required' }, { status: 400 });
    }

    try {
        const result = await db.select()
            .from(systemSettings)
            .where(eq(systemSettings.key, key))
            .limit(1);

        return NextResponse.json({
            success: true,
            data: result[0]?.value || {}
        });
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const { key, value } = await req.json();

        if (!key) {
            return NextResponse.json({ error: 'Key required' }, { status: 400 });
        }

        // Upsert logic
        await db.insert(systemSettings)
            .values({ key, value })
            .onConflictDoUpdate({
                target: systemSettings.key,
                set: { value, updatedAt: new Date() }
            });

        return NextResponse.json({ success: true });
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
