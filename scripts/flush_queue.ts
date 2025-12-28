
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import { notificationOrchestrator } from '@/lib/notifications/NotificationOrchestrator';
import { db } from '@/lib/db';
import { sql } from 'drizzle-orm';

async function main() {
    console.log('🧹 Flushing Mission Queue manually...');
    try {
        const results = await notificationOrchestrator.executeDailyOutreach();
        console.log('✅ Queue Flushed:', results);
    } catch (error) {
        console.error('❌ Error flushing queue:', error);
    }
    process.exit(0);
}

main();
