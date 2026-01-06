
import { IMessagingAdapter } from '../interfaces';
import axios from 'axios';

export class TelegramAdapter implements IMessagingAdapter {
    providerId = 'telegram';

    private getCredentials() {
        if (!process.env.TELEGRAM_BOT_TOKEN) {
            console.error('Telegrarm Credentials Missing');
            throw new Error("Telegram Credentials Missing");
        }
        return {
            token: process.env.TELEGRAM_BOT_TOKEN
        };
    }

    async sendMessage(to: string, text: string, metadata: any = {}) {
        try {
            const { token } = this.getCredentials();
            const url = `https://api.telegram.org/bot${token}/sendMessage`;

            // Telegram expects 'chat_id' which we are passing in 'to'
            const payload = {
                chat_id: to,
                text: text,
                parse_mode: 'Markdown'
            };

            const response = await axios.post(url, payload);

            if (response.data && response.data.ok) {
                return { success: true, data: response.data };
            } else {
                return { success: false, error: 'Telegram API returned false for ok' };
            }
        } catch (error: any) {
            console.error('Telegram Adapter Send Error:', error.response?.data || error.message);
            return { success: false, error: error.response?.data || error.message };
        }
    }

    async validateContact(contact: string): Promise<boolean> {
        // Telegram chat IDs are usually numbers
        return /^\d+$/.test(contact);
    }
}
