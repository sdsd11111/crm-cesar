
import { IMessagingAdapter } from '../interfaces';
import { whatsappService } from '@/lib/whatsapp/WhatsAppService';
import { evolutionWhatsAppService } from '@/lib/whatsapp/EvolutionWhatsAppService';

export class WhatsAppAdapter implements IMessagingAdapter {
    providerId = 'whatsapp';

    private useEvolution() {
        return !!process.env.EVOLUTION_API_URL;
    }

    async sendMessage(to: string, text: string, metadata: any = {}) {
        if (this.useEvolution()) {
            return await evolutionWhatsAppService.sendMessage(to, text);
        }
        
        const response = await whatsappService.sendMessage(to, text, metadata, metadata.media);
        return response.success ? { success: true, data: response.data } : { success: false, error: response.error };
    }

    async sendTemplate(to: string, templateName: string, language = 'es', components: any[] = []) {
        if (this.useEvolution()) {
            return { success: false, error: 'Templates not implemented for Evolution API yet' };
        }
        return await whatsappService.sendTemplate(to, templateName, language, components);
    }

    async sendDocument(to: string, buffer: Buffer, filename: string, caption?: string, metadata: any = {}) {
        try {
            if (this.useEvolution()) {
                console.log(`🚀 [WhatsAppAdapter] Routing through Evolution API`);
                return await evolutionWhatsAppService.sendDocument(to, buffer, filename, caption);
            }

            console.log(`🏢 [WhatsAppAdapter] Routing through Meta Graph API`);
            const uploadResult = await whatsappService.uploadMedia(buffer, filename, 'application/pdf', 'document');

            if (!uploadResult.success || !uploadResult.mediaId) {
                return { success: false, error: uploadResult.error || 'Fallo upload a Meta' };
            }

            const media = {
                type: 'document' as const,
                id: uploadResult.mediaId,
                filename: filename,
                caption: caption
            };

            const response = await whatsappService.sendMessage(to, '', metadata, media);
            return response.success ? { success: true, data: response.data } : { success: false, error: response.error };
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
