/**
 * scheduler.ts — Donna's Proactive Brain
 *
 * Runs background jobs making Donna proactive:
 * - Daily morning briefing at 8 AM: sends César a Telegram summary of today's calendar
 */

import { bot } from "./bot/telegram.js";
import { env } from "./config/env.js";
import { authorize } from "./tools/googleAuth.js";
import { google } from "googleapis";

// --------------------------------------------------
// Helpers
// --------------------------------------------------

function msUntilTime(hour: number, minute: number = 0): number {
    const now = new Date();
    const target = new Date();
    // Use Ecuador time (UTC-5). Adjust as necessary.
    // We set the target to today's target hour in local time.
    target.setHours(hour, minute, 0, 0);
    if (target <= now) {
        // Already past — schedule for tomorrow
        target.setDate(target.getDate() + 1);
    }
    return target.getTime() - now.getTime();
}

function repeat(fn: () => void, every24h: boolean = true): void {
    fn();
    if (every24h) {
        setInterval(fn, 24 * 60 * 60 * 1000);
    }
}

// --------------------------------------------------
// Daily Briefing Job
// --------------------------------------------------

async function sendDailyBriefing(): Promise<void> {
    const primaryUserId = env.TELEGRAM_ALLOWED_USER_IDS[0];
    if (!primaryUserId) return;

    try {
        const authClient = await authorize();
        const calendar = google.calendar({ version: "v3", auth: authClient as any });

        // Get events for today and tomorrow
        const now = new Date();
        const tomorrow = new Date();
        tomorrow.setDate(now.getDate() + 1);
        tomorrow.setHours(23, 59, 59);

        const response = await calendar.events.list({
            calendarId: "primary",
            timeMin: now.toISOString(),
            timeMax: tomorrow.toISOString(),
            singleEvents: true,
            orderBy: "startTime",
            maxResults: 10,
        });

        const events = response.data.items ?? [];

        if (events.length === 0) {
            await bot.api.sendMessage(primaryUserId,
                "🌅 *Buenos días, César!* Tu día está libre, sin citas registradas en el calendario. ¡Perfecto para cerrar ventas desde la calle! 💪",
                { parse_mode: "Markdown" }
            );
            return;
        }

        const lines = events.map(event => {
            const start = event.start?.dateTime
                ? new Date(event.start.dateTime).toLocaleTimeString("es-EC", { hour: "2-digit", minute: "2-digit", hour12: true })
                : "Todo el día";
            return `• ${start} — *${event.summary ?? "Sin título"}*`;
        });

        const message = `🌅 *Buenos días, César!*\n\nTienes *${events.length} compromiso(s)* hoy y mañana:\n\n${lines.join("\n")}\n\n_Dime si quieres que confirme alguna cita o reagende algo._`;

        await bot.api.sendMessage(primaryUserId, message, { parse_mode: "Markdown" });
        console.log(`[Scheduler] Daily briefing sent to user ${primaryUserId}`);

    } catch (error) {
        console.error("[Scheduler] Error sending daily briefing:", error);
        // Silent fail — don't crash the bot
    }
}

// --------------------------------------------------
// Start the Scheduler
// --------------------------------------------------

export function startScheduler(): void {
    // Daily briefing at 8:00 AM (Ecuador time, UTC-5 = 13:00 UTC)
    // We use local machine time here. If deploying on Render (UTC), set BRIEFING_HOUR to 13.
    const briefingHour = parseInt(process.env.BRIEFING_HOUR ?? "8", 10);

    const msUntilBriefing = msUntilTime(briefingHour, 0);
    const hoursUntil = Math.round(msUntilBriefing / 1000 / 60 / 60 * 10) / 10;

    console.log(`[Scheduler] Daily briefing scheduled in ${hoursUntil}h (at ${briefingHour}:00).`);

    // First run at target time, then every 24h
    setTimeout(() => {
        repeat(sendDailyBriefing);
    }, msUntilBriefing);

    // CRM Keep-Alive Ping (Runs every 10 minutes to stay within Render's 15min limit)
    startKeepAlivePing();
}

/**
 * Pings the CRM every 10 minutes to prevent Render's Free tier from spinning down.
 */
function startKeepAlivePing(): void {
    const CRM_URL = env.CRM_BASE_URL;
    if (!CRM_URL) {
        console.warn("[KeepAlive] CRM_BASE_URL not set. Skipping ping.");
        return;
    }

    const PING_INTERVAL_MS = 10 * 60 * 1000; // 10 minutes

    const doPing = async () => {
        try {
            console.log(`[KeepAlive] 📡 Pinging CRM at ${new Date().toLocaleTimeString()}...`);
            // We use a simple GET request to any public endpoint or root
            const response = await fetch(CRM_URL, { method: 'HEAD' });
            if (response.ok) {
                console.log(`[KeepAlive] ✅ CRM is Awake (Status: ${response.status})`);
            } else {
                console.warn(`[KeepAlive] ⚠️ CRM responded with status ${response.status}`);
            }
        } catch (error) {
            console.error("[KeepAlive] ❌ CRM Ping failed:", (error as Error).message);
        }
    };

    // Run immediately and then every 10 minutes
    doPing();
    setInterval(doPing, PING_INTERVAL_MS);
}
