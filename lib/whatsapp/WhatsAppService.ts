import axios from 'axios';
import { db } from '../db';
import { contacts, whatsappLogs } from '../db/schema';
import { eq } from 'drizzle-orm';

export interface WhatsAppMessage {
    number: string;
    text: string;
    delay?: number;
    linkPreview?: boolean;
}

export class WhatsAppService {
    private apiUrl: string;
    private apiKey: string;
    private instanceName: string;

    constructor() {
        this.apiUrl = process.env.WHATSAPP_API_URL || 'http://localhost:8080';
        this.apiKey = process.env.WHATSAPP_API_KEY || process.env.AUTHENTICATION_API_KEY || '';
        this.instanceName = process.env.WHATSAPP_INSTANCE_NAME || 'Donna';

        console.log(`📡 WhatsAppService Initialized:`);
        console.log(`   - API URL: ${this.apiUrl}`);
        console.log(`   - API Key: ${this.apiKey ? '***' + this.apiKey.slice(-4) : 'MISSING ❌'}`);
        console.log(`   - Instance: ${this.instanceName}`);
    }

    /**
     * Gets instance status
     */
    async fetchStatus(): Promise<any> {
        console.log(`🔍 WhatsAppService: Fetching status from ${this.apiUrl} for ${this.instanceName}...`);
        if (!this.apiUrl || !this.apiKey) {
            console.error('❌ WhatsAppService: API URL or Key missing in config');
            return { success: false, error: 'Config missing' };
        }
        try {
            const url = `${this.apiUrl}/instance/connectionState/${this.instanceName}`;
            const response = await axios.get(url, { headers: { 'apikey': this.apiKey } });
            console.log('✅ WhatsAppService: Status fetched:', response.data);
            return { success: true, data: response.data };
        } catch (error: any) {
            const errorMsg = error.response?.data?.message || error.response?.data || error.message || "Unknown error";
            console.error('❌ WhatsAppService: Status fetch error:', errorMsg);
            return { success: false, error: errorMsg };
        }
    }

    /**
     * Connects and gets QR Code
     */
    async fetchQR(): Promise<any> {
        console.log(`🔍 WhatsAppService: Requesting QR from ${this.apiUrl} for ${this.instanceName}...`);
        if (!this.apiUrl || !this.apiKey) {
            console.error('❌ WhatsAppService: API URL or Key missing in config');
            return { success: false, error: 'Config missing' };
        }
        try {
            const url = `${this.apiUrl}/instance/connect/${this.instanceName}`;
            const response = await axios.get(url, { headers: { 'apikey': this.apiKey } });
            console.log('✅ WhatsAppService: QR Response received:', JSON.stringify(response.data, null, 2));
            return { success: true, data: response.data };
        } catch (error: any) {
            const errorMsg = error.response?.data?.message || error.response?.data || error.message || "Unknown error";
            console.error('❌ WhatsAppService: QR Request error:', errorMsg);
            return { success: false, error: errorMsg };
        }
    }

    /**
     * Logouts instance
     */
    async logoutInstance(): Promise<any> {
        if (!this.apiUrl || !this.apiKey) return { success: false, error: 'Config missing' };
        try {
            const url = `${this.apiUrl}/instance/logout/${this.instanceName}`;
            const response = await axios.delete(url, { headers: { 'apikey': this.apiKey } });
            return { success: true, data: response.data };
        } catch (error: any) {
            return { success: false, error: error.response?.data || error.message };
        }
    }

    /**
     * Sends a text message via Evolution API with opt-out check and logging
     * @param phone Phone number
     * @param text Message content
     * @param metadata Optional metadata for logging (trigger, approvedBy, etc.)
     */
    async sendMessage(phone: string, text: string, metadata: any = {}): Promise<any> {
        if (!this.apiUrl || !this.apiKey) {
            console.error('❌ WhatsAppService: API URL or Key not configured');
            return { success: false, error: 'Config missing' };
        }

        // Clean phone number
        let cleanPhone = phone.replace(/\D/g, '');
        if (cleanPhone.startsWith('0') && cleanPhone.length === 10) {
            cleanPhone = '593' + cleanPhone.slice(1);
        } else if (cleanPhone.length === 9 && !cleanPhone.startsWith('593')) {
            cleanPhone = '593' + cleanPhone;
        }

        try {
            // 1. Check for Opt-Out
            const [contact] = await db
                .select()
                .from(contacts)
                .where(eq(contacts.phone, phone))
                .limit(1);

            if (contact?.whatsappOptOut) {
                console.warn(`🚫 WhatsAppService: Blocked by Opt-Out for ${phone}`);
                return { success: false, error: 'Contact opted out' };
            }

            // 2. Send via API
            const url = `${this.apiUrl}/message/sendText/${this.instanceName}`;
            const response = await axios.post(
                url,
                {
                    number: cleanPhone,
                    text: text,
                    delay: Math.floor(Math.random() * (3000 - 1000 + 1)) + 1000,
                    linkPreview: true
                },
                { headers: { 'apikey': this.apiKey, 'Content-Type': 'application/json' } }
            );

            // 3. LOG SUCCESS
            await db.insert(whatsappLogs).values({
                contactId: contact?.id || null,
                trigger: metadata.type || 'system',
                content: text,
                status: 'sent',
                approvedBy: metadata.approvedBy || 'system',
                metadata: JSON.stringify(metadata)
            });

            console.log(`✅ WhatsApp sent to ${cleanPhone}`);
            return { success: true, data: response.data };
        } catch (error: any) {
            const errorMsg = error.response?.data?.message || error.message;
            console.error(`❌ WhatsApp error:`, errorMsg);

            // 4. LOG FAILURE
            try {
                const [contact] = await db.select().from(contacts).where(eq(contacts.phone, phone)).limit(1);
                await db.insert(whatsappLogs).values({
                    contactId: contact?.id || null,
                    trigger: metadata.type || 'system',
                    content: text,
                    status: 'failed',
                    errorMessage: errorMsg,
                    metadata: JSON.stringify(metadata)
                });
            } catch (e) { /* silent fail for logging error */ }

            return { success: false, error: errorMsg };
        }
    }

    /**
     * Sends a media message (image/pdf)
     */
    async sendMedia(phone: string, mediaUrl: string, caption: string, type: 'image' | 'document' = 'image'): Promise<any> {
        const cleanPhone = phone.replace(/\D/g, '');

        try {
            const url = `${this.apiUrl}/message/sendMedia/${this.instanceName}`;
            const response = await axios.post(
                url,
                {
                    number: cleanPhone,
                    mediatype: type,
                    caption: caption,
                    media: mediaUrl
                },
                {
                    headers: {
                        'apikey': this.apiKey,
                        'Content-Type': 'application/json'
                    }
                }
            );

            return { success: true, data: response.data };
        } catch (error: any) {
            console.error(`❌ WhatsApp media error:`, error.response?.data || error.message);
            return { success: false, error: error.response?.data || error.message };
        }
    }
}

export const whatsappService = new WhatsAppService();
