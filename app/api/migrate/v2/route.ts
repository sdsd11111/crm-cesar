import { db } from '@/lib/db';
import { sql } from 'drizzle-orm';
import { NextResponse } from 'next/server';

export async function GET() {
    console.log('🚀 API Migration: Donna v2.0...');
    try {
        await db.execute(sql`
      ALTER TABLE donna_chat_messages 
      ADD COLUMN IF NOT EXISTS message_timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
    `);
        console.log('✅ Column added.');

        await db.execute(sql`
      CREATE INDEX IF NOT EXISTS idx_message_timestamp ON donna_chat_messages(message_timestamp);
    `);
        console.log('✅ Index created.');

        return NextResponse.json({ success: true, message: 'Migration Donna v2.0 completed successfully' });
    } catch (error: any) {
        console.error('❌ API Migration Failed:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
