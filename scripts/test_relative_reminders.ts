import './load_env';
import { db } from '@/lib/db';
import { reminders, tasks } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

async function testRelativeTimeReminder() {
    console.log('🧪 Testing relative time reminder creation...\n');

    // Simulate creating a task with relative time
    const testTask = await db.insert(tasks).values({
        title: 'Test: Llamada en 5 minutos',
        description: 'Testing relative time',
        status: 'todo',
        priority: 'high',
        assignedTo: 'César'
    }).returning();

    const taskId = testTask[0].id;
    console.log(`✅ Test task created: ${taskId}\n`);

    // Simulate "en 5 minutos, avísame 2 minutos antes"
    const dueDate = new Date(Date.now() + 5 * 60000); // 5 minutes from now
    const offset = 2; // 2 minutes before
    const sendAt = new Date(dueDate.getTime() - offset * 60000);

    await db.insert(reminders).values({
        taskId: taskId,
        title: '🔔 Recordatorio: Llamada en 5 minutos',
        message: 'Faltan 2 min para: Llamada en 5 minutos',
        sendAt: sendAt,
        status: 'pending',
        channel: 'telegram'
    });

    console.log(`⏰ Reminder created:`);
    console.log(`   Due at: ${dueDate.toLocaleString('es-EC')}`);
    console.log(`   Send at: ${sendAt.toLocaleString('es-EC')}`);
    console.log(`   Time until notification: ${Math.round((sendAt.getTime() - Date.now()) / 1000)} seconds\n`);

    // Query all pending reminders
    const allReminders = await db.select().from(reminders).where(eq(reminders.status, 'pending'));
    console.log(`📋 Total pending reminders: ${allReminders.length}\n`);

    allReminders.forEach(r => {
        const timeUntil = Math.round((new Date(r.sendAt).getTime() - Date.now()) / 1000);
        console.log(`   - ${r.title}`);
        console.log(`     Send at: ${new Date(r.sendAt).toLocaleString('es-EC')}`);
        console.log(`     Time until: ${timeUntil}s\n`);
    });
}

testRelativeTimeReminder();
