import axios from 'axios';
import { db } from '../db';
import { contacts, whatsappLogs, discoveryLeads, interactions } from '../db/schema';
import { eq, sql } from 'drizzle-orm';

export interface WhatsAppMedia {
    type: 'image' | 'video' | 'audio' | 'document';
    url?: string;
    id?: string;
    caption?: string;
    filename?: string;
}

export class WhatsAppService {
    private version: string = 'v21.0';

    constructor() {
        console.log(`📡 WhatsAppService (Meta) Multimedia-Enabled Initialized`);
    }

    private getCredentials() {
        return {
            accessToken: process.env.META_WA_ACCESS_TOKEN || '',
            phoneNumberId: process.env.META_WA_PHONE_NUMBER_ID || '',
            verifyToken: process.env.META_WA_VERIFY_TOKEN || ''
        };
    }

    /**
     * Unified method for sending messages (Text or Multimedia)
     */
    async sendMessage(phone: string, text: string, metadata: any = {}, media?: WhatsAppMedia): Promise<any> {
        const { accessToken, phoneNumberId } = this.getCredentials();

        if (!accessToken || !phoneNumberId) {
            console.error('❌ WhatsAppService: Meta Credentials missing');
            return { success: false, error: 'Config missing' };
        }

        try {
            // 1. Clean phone number
            const cleanPhone = phone.replace(/\D/g, '');
            const last9 = cleanPhone.slice(-9);

            // 2. Flexible Match for Contact/Opt-Out
            const [contact] = await db
                .select()
                .from(contacts)
                .where(sql`${contacts.phone} LIKE ${'%' + last9}`)
                .limit(1);

            if (contact?.whatsappOptOut) {
                console.warn(`🚫 WhatsAppService: Blocked by Opt-Out for ${phone}`);
                return { success: false, error: 'Contact opted out' };
            }

            // 3. Build Meta Payload
            let payload: any = {
                messaging_product: "whatsapp",
                recipient_type: "individual",
                to: cleanPhone
            };

            if (media) {
                payload.type = media.type;
                payload[media.type] = {
                    ...(media.id ? { id: media.id } : { link: media.url }),
                    ...(media.caption ? { caption: media.caption } : {}),
                    ...(media.type === 'document' && media.filename ? { filename: media.filename } : {})
                };
            } else {
                payload.type = "text";
                payload.text = {
                    body: text,
                    preview_url: true
                };
            }

            // 4. Send via Meta API
            const url = `https://graph.facebook.com/${this.version}/${phoneNumberId}/messages`;
            const response = await axios.post(url, payload, {
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': 'application/json'
                }
            });

            // 5. LOG SUCCESS (DB Interactions & Logs)
            try {
                let contactId = contact?.id || null;
                let discoveryLeadId = null;

                if (!contactId) {
                    const [lead] = await db.select().from(discoveryLeads)
                        .where(sql`${discoveryLeads.telefonoPrincipal} LIKE ${'%' + last9}`)
                        .limit(1);

                    if (lead) {
                        discoveryLeadId = lead.id;
                    } else {
                        console.log(`👤 [Outbound] Creating Ghost Prospect for unknown number: ${cleanPhone}`);
                        const [newContact] = await db.insert(contacts).values({
                            businessName: `WhatsApp ${cleanPhone.slice(-4)}`,
                            contactName: 'Nuevo Contacto (WhatsApp)',
                            phone: cleanPhone,
                            entityType: 'prospect',
                            source: 'whatsapp_outbound',
                            status: 'sin_contacto',
                            outreachStatus: 'new'
                        }).returning();
                        contactId = newContact.id;
                    }
                }

                const logContent = media ? `[Multimedia: ${media.type}] ${media.caption || ''}` : text;

                // A. Insert into Interactions (Audit)
                await db.insert(interactions).values({
                    contactId: contactId,
                    discoveryLeadId: discoveryLeadId,
                    type: 'whatsapp',
                    content: logContent,
                    direction: 'outbound',
                    performedAt: new Date(),
                    createdAt: new Date(),
                    metadata: {
                        source: metadata.source || 'system',
                        data: response.data,
                        media: media || null
                    }
                });

                // B. Insert into WhatsApp Logs (Technical Audit)
                await db.insert(whatsappLogs).values({
                    contactId: contactId,
                    trigger: metadata.type || 'system',
                    content: logContent,
                    status: 'sent',
                    approvedBy: metadata.approvedBy || 'system',
                    metadata: { ...metadata, metaResponse: response.data }
                });
            } catch (dbError) {
                console.warn('⚠️ Log/Interaction skipped (DB error)', dbError);
            }

            return { success: true, data: response.data };
        } catch (error: any) {
            const errorData = error.response?.data?.error || { message: error.message };
            console.error(`❌ Meta WhatsApp error:`, errorData.message);
            return { success: false, error: errorData.message, details: errorData };
        }
    }

    /**
     * Uploads media to Meta Cloud API to get a media_id
     */
    async uploadMedia(fileBuffer: Buffer, fileName: string, mimeType: string, type: string) {
        const { accessToken, phoneNumberId } = this.getCredentials();
        const url = `https://graph.facebook.com/${this.version}/${phoneNumberId}/media`;

        try {
            const formData = new FormData();
            const blob = new Blob([fileBuffer], { type: mimeType });
            formData.append('file', blob, fileName);
            formData.append('messaging_product', 'whatsapp');
            formData.append('type', type);

            const response = await axios.post(url, formData, {
                headers: {
                    'Authorization': `Bearer ${accessToken}`
                }
            });

            return { success: true, mediaId: response.data.id };
        } catch (error: any) {
            console.error('❌ uploadMedia Error:', error.response?.data || error.message);
            return { success: false, error: error.message };
        }
    }

    /**
     * Downloads media from Meta Cloud API
     */
    async getMedia(mediaId: string): Promise<{ buffer: Buffer; mimeType: string } | null> {
        const { accessToken } = this.getCredentials();
        try {
            // 1. Get the media URL from the ID
            const infoUrl = `https://graph.facebook.com/${this.version}/${mediaId}`;
            const infoRes = await axios.get(infoUrl, {
                headers: { 'Authorization': `Bearer ${accessToken}` }
            });

            const mediaUrl = infoRes.data.url;
            const mimeType = infoRes.data.mime_type;

            if (!mediaUrl) return null;

            // 2. Download the actual binary
            const downloadRes = await axios.get(mediaUrl, {
                headers: { 'Authorization': `Bearer ${accessToken}` },
                responseType: 'arraybuffer'
            });

            return {
                buffer: Buffer.from(downloadRes.data),
                mimeType: mimeType
            };
        } catch (error: any) {
            console.error(`❌ getMedia Error (${mediaId}):`, error.response?.data || error.message);
            return null;
        }
    }

    /**
     * Sends a template message
     */
    async sendTemplate(phone: string, templateName: string, languageCode: string = 'es_ES', components: any[] = []): Promise<any> {
        const { accessToken, phoneNumberId } = this.getCredentials();
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
            if (components.length > 0) payload.template.components = components;

            const response = await axios.post(url, payload, {
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': 'application/json'
                }
            });
            return { success: true, data: response.data };
        } catch (error: any) {
            const errorData = error.response?.data?.error || { message: error.message };
            return { success: false, error: errorData.message, details: errorData };
        }
    }
}

export const whatsappService = new WhatsAppService();
