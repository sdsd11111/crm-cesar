import Groq from "groq-sdk";
import OpenAI from "openai";
import { env } from "../config/env.js";
import { AVAILABLE_TOOLS } from "../tools/index.js";

const groq = new Groq({ apiKey: env.GROQ_API_KEY });
const openRouter = env.OPENROUTER_API_KEY
    ? new OpenAI({
        apiKey: env.OPENROUTER_API_KEY,
        baseURL: "https://openrouter.ai/api/v1"
    })
    : null;
const gemini = env.GEMINI_API_KEY
    ? new OpenAI({ apiKey: env.GEMINI_API_KEY, baseURL: "https://generativelanguage.googleapis.com/v1beta/openai/" })
    : null;
const deepseek = env.DEEPSEEK_API_KEY
    ? new OpenAI({ apiKey: env.DEEPSEEK_API_KEY, baseURL: "https://api.deepseek.com/v1" })
    : null;

// Llama 3.3 70B is recommended for Groq
const GROQ_MODEL = "llama-3.3-70b-versatile";
const GEMINI_MODEL = "gemini-1.5-flash"; // gemini-1.5-flash is stable and supports tools via OpenAI SDK

export type ChatMessage = Groq.Chat.Completions.ChatCompletionMessageParam;

export async function createChatCompletion(messages: ChatMessage[]) {
    // 1. Try DeepSeek first
    if (deepseek) {
        try {
            const isReasoner = env.DEEPSEEK_MODEL.includes("reasoner");
            const completion = await deepseek.chat.completions.create({
                model: env.DEEPSEEK_MODEL,
                messages: messages as OpenAI.Chat.Completions.ChatCompletionMessageParam[],
                ...(isReasoner ? {} : {
                    tools: AVAILABLE_TOOLS as unknown as OpenAI.Chat.Completions.ChatCompletionTool[],
                    tool_choice: "auto"
                }),
                ...(isReasoner ? {} : { temperature: 0.2 }),
            });
            return completion.choices[0].message;
        } catch (error: any) {
            console.error("DeepSeek API Error:", error.message);
            const shouldFallback = error.status === 429 || error.status >= 500;
            if (!shouldFallback) throw error;
        }
    }

    // 2. Try Groq

    // 2. Try OpenRouter
    if (openRouter) {
        console.log(`Falling back to OpenRouter using model ${env.OPENROUTER_MODEL}...`);
        try {
            const fallbackCompletion = await openRouter.chat.completions.create({
                model: env.OPENROUTER_MODEL,
                messages: messages as OpenAI.Chat.Completions.ChatCompletionMessageParam[],
                tools: AVAILABLE_TOOLS as unknown as OpenAI.Chat.Completions.ChatCompletionTool[],
                tool_choice: "auto",
                temperature: 0.2,
            });
            return fallbackCompletion.choices[0].message;
        } catch (error: any) {
            console.error("OpenRouter API Error:", error.message);
            const shouldFallback = error.status === 429 || error.status >= 500;
            if (!shouldFallback) throw error;
        }
    }

    // 3. Try Gemini
    if (gemini) {
        console.log(`Falling back to Gemini using model ${GEMINI_MODEL}...`);
        try {
            const fallbackCompletion = await gemini.chat.completions.create({
                model: GEMINI_MODEL,
                messages: messages as OpenAI.Chat.Completions.ChatCompletionMessageParam[],
                tools: AVAILABLE_TOOLS as unknown as OpenAI.Chat.Completions.ChatCompletionTool[],
                tool_choice: "auto",
                temperature: 0.2,
            });
            return fallbackCompletion.choices[0].message;
        } catch (error: any) {
            console.error("Gemini API Error:", error.message);
            const shouldFallback = error.status === 429 || error.status >= 500;
            if (!shouldFallback) throw error;
        }
    }

    // 5. Try Groq Fallback (moved here if DeepSeek fails)
    try {
        console.log(`Falling back to Groq using model ${GROQ_MODEL}...`);
        const fallbackCompletion = await groq.chat.completions.create({
            model: GROQ_MODEL,
            messages: messages,
            tools: AVAILABLE_TOOLS as unknown as Groq.Chat.Completions.ChatCompletionTool[],
            tool_choice: "auto",
            temperature: 0.2,
        });
        return fallbackCompletion.choices[0].message;
    } catch (error: any) {
        console.error("Groq fallback API Error:", error.message);
        throw error;
    }

    throw new Error("All configured LLM providers failed or were not configured properly.");
}
