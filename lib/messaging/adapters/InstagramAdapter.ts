
import { IMessagingAdapter } from '../interfaces';

export class InstagramAdapter implements IMessagingAdapter {
    providerId = 'instagram';

    private accessToken: string;
    private baseURL: string;

    constructor() {
        this.accessToken = process.env.INSTAGRAM_ACCESS_TOKEN || '';
        this.baseURL = 'https://graph.facebook.com/v19.0';
    }

    async sendMessage(to: string, text: string, metadata?: any): Promise<{ success: boolean; data?: any; error?: string }> {
        if (!this.accessToken) {
            console.error('❌ InstagramAdapter: INSTAGRAM_ACCESS_TOKEN missing');
            return { success: false, error: 'Instagram Access Token missing' };
        }

        try {
            // Meta Graph API for Instagram Messages
            // Endpoint: /{IG_USER_ID}/messages
            // 'to' should be the ASID (App Scoped User ID) for the Instagram user

            const response = await fetch(`${this.baseURL}/me/messages`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.accessToken}`
                },
                body: JSON.stringify({
                    recipient: { id: to },
                    message: { text: text },
                    messaging_type: 'RESPONSE'
                })
            });

            const data = await response.json();

            if (!response.ok) {
                console.error('❌ Instagram API Error:', data);
                return { success: false, error: data.error?.message || 'Instagram API Error', data };
            }

            return { success: true, data };
        } catch (error: any) {
            console.error('❌ InstagramAdapter Network Error:', error);
            return { success: false, error: error.message };
        }
    }

    async validateContact(contact: string): Promise<boolean> {
        // IDs are usually strings like "1234567890"
        return typeof contact === 'string' && contact.length > 5;
    }
}
