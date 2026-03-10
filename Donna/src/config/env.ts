import { z } from "zod";
import * as dotenv from "dotenv";

dotenv.config();

const envSchema = z.object({
    TELEGRAM_BOT_TOKEN: z.string().min(1, "Bot token is required"),
    TELEGRAM_ALLOWED_USER_IDS: z.string().transform((val) => val.split(",").map(id => id.trim())),
    GROQ_API_KEY: z.string().min(1, "Groq API key is required"),
    OPENROUTER_API_KEY: z.string().optional(),
    OPENROUTER_MODEL: z.string().default("openrouter/free"),
    GEMINI_API_KEY: z.string().optional(),
    DEEPSEEK_API_KEY: z.string().optional(),
    DEEPSEEK_MODEL: z.string().default("deepseek-reasoner"),
    DB_PATH: z.string().default("./memory.db"),
    // WhatsApp — Evolution API
    EVOLUTION_API_URL: z.string().optional(),
    EVOLUTION_API_KEY: z.string().optional(),
    EVOLUTION_INSTANCE: z.string().optional(),
    // CRM
    CRM_BASE_URL: z.string().optional(),
    DONNA_API_SECRET: z.string().optional(),
    // Scheduler
    BRIEFING_HOUR: z.string().default("8"),
});

export const env = envSchema.parse(process.env);
