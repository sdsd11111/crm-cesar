import * as fs from 'fs';
import * as path from 'path';

// Manual env load before any other imports
const envPath = path.resolve(process.cwd(), '.env.local');
const envConfig = fs.readFileSync(envPath, 'utf8');
envConfig.split('\n').forEach(line => {
    const [key, ...value] = line.split('=');
    if (key && value) process.env[key.trim()] = value.join('=').trim();
});

import { db } from '@/lib/db';
import { sql } from 'drizzle-orm';

async function debug() {
    console.log("=== WHATSAPP CHAT DEBUG ===");

    try {
        console.log("1. Checking total messages in donna_chat_messages...");
        const total = await db.execute(sql`SELECT count(*) FROM donna_chat_messages`);
        console.log("   Total messages:", (total as any)[0].count);

        console.log("\n2. Checking platform distribution...");
        const platforms = await db.execute(sql`
            SELECT platform, count(*) 
            FROM donna_chat_messages 
            GROUP BY platform
        `);
        console.log("   Platforms:", platforms);

        console.log("\n3. Checking last 5 messages...");
        const lastMessages = await db.execute(sql`
            SELECT id, chat_id, platform, role, content, message_timestamp 
            FROM donna_chat_messages 
            ORDER BY message_timestamp DESC 
            LIMIT 5
        `);
        console.log("   Last 5 messages:", JSON.stringify(lastMessages, null, 2));

        console.log("\n4. Checking if any 'telegram' messages should be 'whatsapp'...");
        // (Just a hunch based on previous fixes)
        const sampleTelegram = await db.execute(sql`
            SELECT chat_id, content 
            FROM donna_chat_messages 
            WHERE platform = 'telegram' 
            LIMIT 5
        `);
        console.log("   Sample 'telegram' messages:", sampleTelegram);

    } catch (error) {
        console.error("❌ Debug failed:", error);
    }

    console.log("=== DEBUG COMPLETE ===");
}

debug().catch(console.error);
