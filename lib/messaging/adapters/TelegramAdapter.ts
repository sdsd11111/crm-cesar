
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
            return { success: false, error: error.response?.data || error.message, data: undefined };
        }
    }

    async sendDocument(to: string, buffer: Buffer, filename: string, caption?: string, metadata: any = {}) {
        try {
            const { token } = this.getCredentials();
            const url = `https://api.telegram.org/bot${token}/sendDocument`;

            const formData = new FormData();
            formData.append('chat_id', to);
            formData.append('caption', caption || '');
            formData.append('parse_mode', 'Markdown');

            // Convert Buffer to Uint8Array for better compatibility with Blob/fetch
            const uint8Array = new Uint8Array(buffer);
            const blob = new Blob([uint8Array], { type: 'application/pdf' });
            formData.append('document', blob, filename);

            const response = await fetch(url, {
                method: 'POST',
                body: formData
            });

            const data = await response.json();

            if (data && data.ok) {
                return { success: true, data: data.result };
            } else {
                return { success: false, error: data.description || 'Telegram API returned false for ok' };
            }
        } catch (error: any) {
            console.error('Telegram Adapter Send Document Error:', error.message);
            return { success: false, error: error.message, data: undefined };
        }
    }

    async validateContact(contact: string): Promise<boolean> {
        // Telegram chat IDs are usually numbers
        return /^\d+$/.test(contact);
    }
}
