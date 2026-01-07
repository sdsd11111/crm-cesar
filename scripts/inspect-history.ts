
import { db } from '@/lib/db';
import { donnaChatMessages } from '@/lib/db/schema';
import { desc } from 'drizzle-orm';

async function inspectHistory() {
    try {
        const history = await db.select()
            .from(donnaChatMessages)
            .orderBy(desc(donnaChatMessages.messageTimestamp))
            .limit(20);
        console.log("--- Recent Donna History ---");
        console.table(history.map(m => ({
            time: m.messageTimestamp,
            role: m.role,
            content: m.content ? m.content.substring(0, 50) : 'null'
        })));
    } catch (e) {
        console.error("Failed to inspect history:", e);
    }
}

inspectHistory();
