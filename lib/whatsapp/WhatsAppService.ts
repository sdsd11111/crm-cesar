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
    private version: string = 'v22.0';

    constructor() {
        console.log(`📡 WhatsAppService (Meta) Initialized`);
    }

    private getCredentials() {
        return {
            accessToken: process.env.META_WA_ACCESS_TOKEN || '',
            phoneNumberId: process.env.META_WA_PHONE_NUMBER_ID || '',
            verifyToken: process.env.META_WA_VERIFY_TOKEN || ''
        };
    }

    /**
     * Sends a text message via Meta Cloud API 
     * @param phone Phone number (E.164 format without +)
     * @param text Message content
     * @param metadata Optional metadata for logging
     */
    async sendMessage(phone: string, text: string, metadata: any = {}): Promise<any> {
        const { accessToken, phoneNumberId } = this.getCredentials();

        if (!accessToken || !phoneNumberId) {
            console.error('❌ WhatsAppService: Meta Credentials missing');
            console.log('   - Access Token length:', accessToken.length);
            console.log('   - Phone Number ID:', phoneNumberId);
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
            const url = `https://graph.facebook.com/${this.version}/${phoneNumberId}/messages`;
            const response = await axios.post(
                url,
                {
                    messaging_product: "whatsapp",
                    recipient_type: "individual",
                    to: cleanPhone,
                    type: "text",
                    text: {
                        body: text,
                        preview_url: true // Enable Link Previews (Show Featured Image)
                    }
                },
                {
                    headers: {
                        'Authorization': `Bearer ${accessToken}`,
                        'Content-Type': 'application/json'
                    }
                }
            );

            // 3. LOG SUCCESS (Try-catch for local testing without DB)
            try {
                await db.insert(whatsappLogs).values({
                    contactId: contact?.id || null,
                    trigger: metadata.type || 'system',
                    content: text,
                    status: 'sent',
                    approvedBy: metadata.approvedBy || 'system',
                    metadata: metadata // Pass object directly for jsonb
                });
            } catch (dbError) {
                console.warn('⚠️ Log skipped (DB not connected)');
            }

            console.log(`✅ Meta WhatsApp sent to ${cleanPhone} (ID: ${response.data.messages?.[0]?.id})`);
            return {
                success: true,
                data: response.data,
                debug: {
                    url,
                    payload: { messaging_product: "whatsapp", to: cleanPhone, type: "text" }
                }
            };
        } catch (error: any) {
            const errorData = error.response?.data?.error || { message: error.message };
            const errorMsg = errorData.message;
            console.error(`❌ Meta WhatsApp error:`, errorMsg);

            // 4. LOG FAILURE (Try-catch for local testing without DB)
            try {
                const [contact] = await db.select().from(contacts).where(eq(contacts.phone, phone)).limit(1);
                await db.insert(whatsappLogs).values({
                    contactId: contact?.id || null,
                    trigger: metadata.type || 'system',
                    content: text,
                    status: 'failed',
                    errorMessage: errorMsg,
                    metadata: { ...metadata, error: errorData }
                });
            } catch (e) {
                console.warn('⚠️ Log skipped (DB not connected)');
            }

            return {
                success: false,
                error: errorMsg,
                details: errorData,
                debug: {
                    url: `https://graph.facebook.com/${this.version}/${phoneNumberId}/messages`,
                    phoneNumberId
                }
            };
        }
    }

    /**
     * Sends a template message (Required for starting conversations after 24h)
     */
    async sendTemplate(phone: string, templateName: string, languageCode: string = 'es_ES', components: any[] = []): Promise<any> {
        const { accessToken, phoneNumberId } = this.getCredentials();
        // Basic placeholder for marketing/utility templates
        const url = `https://graph.facebook.com/${this.version}/${phoneNumberId}/messages`;
        try {
            const payload: any = {
                messaging_product: "whatsapp",
                to: phone,
                type: "template",
                template: {
                    name: templateName,
                    language: { code: languageCode }
                }
            };

            if (components.length > 0) {
                payload.template.components = components;
            }

            const response = await axios.post(url, payload, {
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': 'application/json'
                }
            });
            return { success: true, data: response.data };
        } catch (error: any) {
            const errorData = error.response?.data?.error || { message: error.message };
            return {
                success: false,
                error: errorData.message,
                details: errorData
            };
        }
    }
}

export const whatsappService = new WhatsAppService();
