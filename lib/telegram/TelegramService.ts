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
    async sendMessage(text: string, parseMode: 'Markdown' | 'HTML' = 'Markdown'): Promise<any> {
        if (!this.botToken || !this.chatId) {
            console.warn('⚠️ TelegramService: Credentials missing (TELEGRAM_BOT_TOKEN or TELEGRAM_CHAT_ID)');
            return { success: false, error: 'Credentials missing' };
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

            const data = await response.json();

            if (!response.ok) {
                console.error('❌ Telegram API Error:', data);
                return { success: false, error: data.description, details: data };
            }

            return { success: true, data };
        } catch (error: any) {
            console.error('❌ TelegramService Network Error:', error);
            return { success: false, error: error.message, details: error };
        }
    }
}

export const telegramService = new TelegramService();
