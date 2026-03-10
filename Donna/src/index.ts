import { bot } from "./bot/telegram.js";
import { env } from "./config/env.js";
import { authorize } from "./tools/googleAuth.js";
import { startScheduler } from "./scheduler.js";

async function main() {
    console.log("Checking Environment Config...");
    if (!env.TELEGRAM_BOT_TOKEN || env.TELEGRAM_BOT_TOKEN.includes("SUSTITUYE")) {
        console.error("Please configure your .env file with real values before starting.");
        process.exit(1);
    }

    try {
        console.log("Checking Google OAuth Credentials...");
        await authorize();
    } catch (authError) {
        console.error("Google Auth skipped/failed:", (authError as Error).message);
    }

    console.log("Starting Donna AI Agent...");

    // Start the bot using long polling
    bot.start({
        onStart(botInfo) {
            console.log(`Bot @${botInfo.username} is running!`);
            console.log(`Listening for whitelist users: ${env.TELEGRAM_ALLOWED_USER_IDS.join(", ")}`);
            // Start the proactive scheduler (daily briefing, reminders, etc.)
            startScheduler();
        },
    });

    // Graceful shutdown
    process.once("SIGINT", () => {
        console.log("Stopping bot...");
        bot.stop();
    });
    process.once("SIGTERM", () => {
        console.log("Stopping bot...");
        bot.stop();
    });
}

main().catch(console.error);
