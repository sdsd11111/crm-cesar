export class TelegramService {
    private botToken: string;
    private chatId: string;

    constructor() {
        this.botToken = process.env.TELEGRAM_BOT_TOKEN || '';
        this.chatId = process.env.TELEGRAM_CHAT_ID || '';
    }

    /**
     * Sends a message to the configured Telegram chat.
     */
    async sendMessage(text: string, parseMode: 'Markdown' | 'HTML' = 'Markdown'): Promise<boolean> {
        if (!this.botToken || !this.chatId) {
            console.warn('⚠️ TelegramService: Credentials missing (TELEGRAM_BOT_TOKEN or TELEGRAM_CHAT_ID)');
            return false;
        }

        try {
            const response = await fetch(`https://api.telegram.org/bot${this.botToken}/sendMessage`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    chat_id: this.chatId,
                    text,
                    parse_mode: parseMode
                }),
            });

            return response.ok;
        } catch (error) {
            console.error('❌ TelegramService Error:', error);
            return false;
        }
    }
}

export const telegramService = new TelegramService();
