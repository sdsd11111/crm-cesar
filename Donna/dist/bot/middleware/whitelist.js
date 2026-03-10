import { env } from "../../config/env.js";
export async function whitelistMiddleware(ctx, next) {
    if (!ctx.from) {
        return; // Ignore updates without a user
    }
    const userId = ctx.from.id.toString();
    if (!env.TELEGRAM_ALLOWED_USER_IDS.includes(userId)) {
        console.log(`Unauthorized access attempt from user ID: ${userId} (@${ctx.from.username})`);
        return; // Silently drop unauthorized requests
    }
    await next();
}
