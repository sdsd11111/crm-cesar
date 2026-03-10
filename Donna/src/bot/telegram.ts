import { Bot } from "grammy";
import { env } from "../config/env.js";
import { whitelistMiddleware } from "./middleware/whitelist.js";
import { runAgentLoop } from "../agent/loop.js";
import { FileFlavor, hydrateFiles } from "@grammyjs/files";
import { transcribeAudio } from "../skills/audio.js";
import * as fs from "fs";
import * as path from "path";
import * as os from "os";

// Apply FileFlavor to Context to enable file downloading
export type BotContext = FileFlavor<import("grammy").Context>;
export const bot = new Bot<BotContext>(env.TELEGRAM_BOT_TOKEN);

// Enable file plugin
bot.api.config.use(hydrateFiles(bot.token));

// Auth middleware applied to ALL routes
bot.use(whitelistMiddleware);

bot.command("start", async (ctx) => {
    await ctx.reply("Hello! I am Donna, your personal AI agent. How can I help you today?");
});

// Common message processor for consistency between text and voice
async function processAgentRequest(ctx: BotContext, userId: string, text: string) {
    try {
        const response = await runAgentLoop(userId, text);
        try {
            await ctx.reply(response, { parse_mode: "Markdown" });
        } catch (parseError) {
            await ctx.reply(response);
        }
    } catch (error) {
        console.error("Error processing message:", error);
        await ctx.reply("Sorry, I encountered a critical error while processing your request.");
    }
}

// Handle text messages
bot.on("message:text", async (ctx) => {
    const userId = ctx.from.id.toString();
    const text = ctx.message.text;

    await ctx.replyWithChatAction("typing");
    await processAgentRequest(ctx, userId, text);
});

// Handle voice/audio messages
bot.on(["message:voice", "message:audio"], async (ctx) => {
    const userId = ctx.from.id.toString();
    await ctx.replyWithChatAction("typing");

    try {
        // Get the file from Telegram
        const file = await ctx.getFile();
        const filePath = await file.download();

        // Inform user we are transcribing
        const msg = await ctx.reply("🎙️ *Escuchando...*", { parse_mode: "Markdown" });

        // Transcribe audio using Groq Whisper
        const transcribedText = await transcribeAudio(filePath);

        // Let the user see what we heard
        await ctx.api.editMessageText(ctx.chat.id, msg.message_id, `🎙️ *Te escuché:* "${transcribedText}"`, { parse_mode: "Markdown" });

        // Cleanup temporary file
        fs.unlinkSync(filePath);

        // Process the transcription through Donna's Agent Loop
        await ctx.replyWithChatAction("typing");
        await processAgentRequest(ctx, userId, transcribedText);

    } catch (error) {
        console.error("Error handling audio message:", error);
        await ctx.reply("Hubo un error al procesar tu audio. ¿Puedes intentar escribiéndomelo?");
    }
});
