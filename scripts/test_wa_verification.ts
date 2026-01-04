
import { config } from 'dotenv';
import path from 'path';
config({ path: path.join(process.cwd(), '.env.local') });

import { db } from '../lib/db';
import { whatsappLogs, interactions } from '../lib/db/schema';
import { desc, eq } from 'drizzle-orm';
import { whatsappService } from '../lib/whatsapp/WhatsAppService';

async function verifyAndSend() {
    console.log('DATABASE_URL:', process.env.DATABASE_URL ? 'FOUND' : 'NOT FOUND');
    console.log('--- Checking Recent Interactions ---');
    try {
        const recentInters = await db.select().from(interactions)
            .where(eq(interactions.type, 'whatsapp'))
            .orderBy(desc(interactions.performedAt))
            .limit(5);

        console.log('Recent Interactions:', JSON.stringify(recentInters, null, 2));

        if (recentInters.length > 0) {
            console.log('✅ Found recent WhatsApp interactions.');
        } else {
            console.log('❌ No recent WhatsApp interactions found.');
        }

        console.log('\n--- Sending Verification Message ---');
        const phone = '0963410409';
        const result = await whatsappService.sendMessage(phone, 'verificado envio');
        console.log('Send Result:', JSON.stringify(result, null, 2));

    } catch (error) {
        console.error('Error:', error);
    }
    process.exit(0);
}

verifyAndSend();
