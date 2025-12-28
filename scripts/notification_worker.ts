import './load_env'; // MUST BE FIRST
import { db } from '@/lib/db';
import { reminders } from '@/lib/db/schema';
import { eq, lte, and } from 'drizzle-orm';
import path from 'path';

// Load environment variables manually if helpful, though standard node run usually loads them if using -r dotenv/config
// dotenv.config({ path: path.join(__dirname, '..', '.env.local') });

const CHECK_INTERVAL_MS = 30000; // 30 seconds

async function sendTelegramMessage(message: string) {
    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    const chatId = process.env.TELEGRAM_CHAT_ID;

    if (!botToken || !chatId) {
        console.error('❌ Missing Telegram config');
        return false;
    }

    try {
        const res = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ chat_id: chatId, text: message })
        });
        return res.ok;
    } catch (error) {
        console.error('❌ Error sending Telegram message:', error);
        return false;
    }
}

async function checkReminders() {
    console.log('⏰ Checking for pending reminders...');
    const now = new Date();

    try {
        // Find pending reminders due now or in the past
        const dueReminders = await db.select()
            .from(reminders)
            .where(and(
                eq(reminders.status, 'pending'),
                lte(reminders.sendAt, now)
            ));

        if (dueReminders.length === 0) {
            // console.log('✅ No pending reminders.');
            return;
        }

        console.log(`🔔 Found ${dueReminders.length} reminders due.`);

        for (const reminder of dueReminders) {
            console.log(`🚀 Sending reminder: ${reminder.title}`);
            const success = await sendTelegramMessage(
                `🔔 *RECORDATORIO*\n\n` +
                `${reminder.title}\n` +
                `${reminder.message}`
            );

            if (success) {
                await db.update(reminders)
                    .set({ status: 'sent', updatedAt: new Date() })
                    .where(eq(reminders.id, reminder.id));
                console.log(`✅ Marked reminder ${reminder.id} as sent.`);
            } else {
                console.error(`❌ Failed to send reminder ${reminder.id}`);
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
