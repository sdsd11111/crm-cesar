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
    private accessToken: string;
    private phoneNumberId: string;
    private verifyToken: string;
    private version: string = 'v21.0';

    constructor() {
        this.accessToken = process.env.META_WA_ACCESS_TOKEN || '';
        this.phoneNumberId = process.env.META_WA_PHONE_NUMBER_ID || '';
        this.verifyToken = process.env.META_WA_VERIFY_TOKEN || '';

        console.log(`📡 WhatsAppService (Meta) Initialized:`);
        console.log(`   - Phone Number ID: ${this.phoneNumberId ? '***' + this.phoneNumberId.slice(-4) : 'MISSING ❌'}`);
        console.log(`   - Access Token: ${this.accessToken ? '***' + this.accessToken.slice(-8) : 'MISSING ❌'}`);
    }

    /**
     * Sends a text message via Meta Cloud API 
     * @param phone Phone number (E.164 format without +)
     * @param text Message content
     * @param metadata Optional metadata for logging
     */
    async sendMessage(phone: string, text: string, metadata: any = {}): Promise<any> {
        if (!this.accessToken || !this.phoneNumberId) {
            console.error('❌ WhatsAppService: Meta Credentials missing');
            return { success: false, error: 'Config missing' };
        }

        // Clean phone number (Meta requires internacional format without leading zeros or +)
        let cleanPhone = phone.replace(/\D/g, '');
        // For Ecuador, ensure it starts with 593
        if (cleanPhone.startsWith('0') && cleanPhone.length === 10) {
            cleanPhone = '593' + cleanPhone.slice(1);
        } else if (cleanPhone.length === 9 && !cleanPhone.startsWith('593')) {
            cleanPhone = '593' + cleanPhone;
        }

        try {
            // 1. Check for Opt-Out (Master Rules)
            const [contact] = await db
                .select()
                .from(contacts)
                .where(eq(contacts.phone, phone))
                .limit(1);

            if (contact?.whatsappOptOut) {
                console.warn(`🚫 WhatsAppService: Blocked by Opt-Out for ${phone}`);
                return { success: false, error: 'Contact opted out' };
            }

            // 2. Send via Meta API
            const url = `https://graph.facebook.com/${this.version}/${this.phoneNumberId}/messages`;
            const response = await axios.post(
                url,
                {
                    messaging_product: "whatsapp",
                    recipient_type: "individual",
                    to: cleanPhone,
                    type: "text",
                    text: { body: text }
                },
                {
                    headers: {
                        'Authorization': `Bearer ${this.accessToken}`,
                        'Content-Type': 'application/json'
                    }
                }
            );

            // 3. LOG SUCCESS
            await db.insert(whatsappLogs).values({
                contactId: contact?.id || null,
                trigger: metadata.type || 'system',
                content: text,
                status: 'sent',
                approvedBy: metadata.approvedBy || 'system',
                metadata: metadata // Pass object directly for jsonb
            });

            console.log(`✅ Meta WhatsApp sent to ${cleanPhone} (ID: ${response.data.messages?.[0]?.id})`);
            return { success: true, data: response.data };
        } catch (error: any) {
            const errorMsg = error.response?.data?.error?.message || error.message;
            console.error(`❌ Meta WhatsApp error:`, errorMsg);

            // 4. LOG FAILURE
            try {
                const [contact] = await db.select().from(contacts).where(eq(contacts.phone, phone)).limit(1);
                await db.insert(whatsappLogs).values({
                    contactId: contact?.id || null,
                    trigger: metadata.type || 'system',
                    content: text,
                    status: 'failed',
                    errorMessage: errorMsg,
                    metadata: metadata // Pass object directly for jsonb
                });
            } catch (e) { /* silent fail */ }

            return { success: false, error: errorMsg };
        }
    }

    /**
     * Sends a template message (Required for starting conversations after 24h)
     */
    async sendTemplate(phone: string, templateName: string, languageCode: string = 'es_ES'): Promise<any> {
        // Basic placeholder for marketing/utility templates
        const url = `https://graph.facebook.com/${this.version}/${this.phoneNumberId}/messages`;
        try {
            const response = await axios.post(url, {
                messaging_product: "whatsapp",
                to: phone,
                type: "template",
                template: {
                    name: templateName,
                    language: { code: languageCode }
                }
            }, { headers: { 'Authorization': `Bearer ${this.accessToken}` } });
            return { success: true, data: response.data };
        } catch (error: any) {
            return { success: false, error: error.response?.data?.error?.message || error.message };
        }
    }
}

export const whatsappService = new WhatsAppService();
