
import { IMessagingAdapter } from '../interfaces';
import { db } from '@/lib/db';
import { systemSettings } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export class InstagramAdapter implements IMessagingAdapter {
    providerId = 'instagram';

    private accessToken: string = '';
    private baseURL: string;

    constructor() {
        this.baseURL = 'https://graph.facebook.com/v19.0';
        this.initialize();
    }

    private async initialize() {
        // Try DB first
        try {
            const [dbConfig] = await db.select().from(systemSettings).where(eq(systemSettings.key, 'instagram_config')).limit(1);
            if (dbConfig?.value && (dbConfig.value as any).accessToken) {
                this.accessToken = (dbConfig.value as any).accessToken;
                console.log('🔌 InstagramAdapter: Using token from Database');
            } else {
                this.accessToken = process.env.INSTAGRAM_ACCESS_TOKEN || '';
                if (this.accessToken) console.log('🔌 InstagramAdapter: Using token from Environment');
            }
        } catch (e) {
            this.accessToken = process.env.INSTAGRAM_ACCESS_TOKEN || '';
        }
    }

    async sendMessage(to: string, text: string, metadata?: any): Promise<{ success: boolean; data?: any; error?: string }> {
        // Ensure initialized if called too fast (though constructor is sync, initialize is async)
        // In practice, since sendMessage is called via UI interaction, initialize will likely be done.
        if (!this.accessToken) {
            await this.initialize();
        }
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
