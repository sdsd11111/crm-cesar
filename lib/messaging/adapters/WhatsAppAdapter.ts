
import { IMessagingAdapter } from '../interfaces';
import { whatsappService } from '@/lib/whatsapp/WhatsAppService';

export class WhatsAppAdapter implements IMessagingAdapter {
    providerId = 'whatsapp';

    async sendMessage(to: string, text: string, metadata: any = {}) {
        // Wrapper around existing robust service
        const response = await whatsappService.sendMessage(to, text, metadata, metadata.media);

        if (response.success) {
            return { success: true, data: response.data };
        } else {
            return { success: false, error: response.error };
        }
    }

    async sendTemplate(to: string, templateName: string, language = 'es', components: any[] = []) {
        // Wrapper for templates
        const response = await whatsappService.sendTemplate(to, templateName, language, components);
        return response;
    }

    async sendDocument(to: string, buffer: Buffer, filename: string, caption?: string, metadata: any = {}) {
        try {
            // 1. Upload media to Meta
            const uploadResult = await whatsappService.uploadMedia(buffer, filename, 'application/pdf', 'document');

            if (!uploadResult.success || !uploadResult.mediaId) {
                return { success: false, error: uploadResult.error || 'Fallo upload a Meta' };
            }

            // 2. Send the document message
            const media = {
                type: 'document' as const,
                id: uploadResult.mediaId,
                filename: filename,
                caption: caption
            };

            const response = await whatsappService.sendMessage(to, '', metadata, media);

            if (response.success) {
                return { success: true, data: response.data };
            } else {
                return { success: false, error: response.error };
            }
        } catch (error: any) {
            console.error('WhatsApp Adapter Send Document Error:', error.message);
            return { success: false, error: error.message, data: undefined };
        }
    }

    async validateContact(contact: string): Promise<boolean> {
        // Basic length check for now, real validation happens on send
        return contact.length >= 10;
    }
}
