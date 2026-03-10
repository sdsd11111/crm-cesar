import './load_env'; // MUST BE FIRST
import { db } from '@/lib/db';
import { reminders } from '@/lib/db/schema';
import { eq, lte, and } from 'drizzle-orm';
import path from 'path';

// Load environment variables manually if helpful, though standard node run usually loads them if using -r dotenv/config
// dotenv.config({ path: path.join(__dirname, '..', '.env.local') });

const CHECK_INTERVAL_MS = 30000; // 30 seconds

async function checkReminders() {
    console.log('⏰ Checking for pending reminders...');
    const now = new Date();
    const { internalNotificationService } = await import('@/lib/messaging/services/InternalNotificationService');

    try {
        // Find pending reminders due now or in the past
        const dueReminders = await db.select()
            .from(reminders)
            .where(and(
                eq(reminders.status, 'pending'),
                lte(reminders.sendAt, now)
            ));

        if (dueReminders.length === 0) {
            return;
        }

        console.log(`🔔 Found ${dueReminders.length} reminders due.`);

        for (const reminder of dueReminders) {
            console.log(`🚀 Sending reminder: ${reminder.title}`);
            const result = await internalNotificationService.sendReminder(reminder.title, reminder.message);

            if (result.success) {
                await db.update(reminders)
                    .set({ status: 'sent', updatedAt: new Date() })
                    .where(eq(reminders.id, reminder.id));
                console.log(`✅ Marked reminder ${reminder.id} as sent.`);
            } else {
                console.error(`❌ Failed to send reminder ${reminder.id}: ${result.error}`);
            }
        }

    } catch (error) {
        console.error('❌ Error checking reminders:', error);
    }
}

async function startWorker() {
    console.log('🚀 Notification Worker Started');
    console.log(`🕒 Checking every ${CHECK_INTERVAL_MS / 1000} seconds...`);

    // Initial check
    await checkReminders();

    // Loop
    setInterval(checkReminders, CHECK_INTERVAL_MS);
}

// Start
startWorker();
