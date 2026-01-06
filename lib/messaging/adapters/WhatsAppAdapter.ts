
import { IMessagingAdapter } from '../interfaces';
import { whatsappService } from '@/lib/whatsapp/WhatsAppService';

export class WhatsAppAdapter implements IMessagingAdapter {
    providerId = 'whatsapp';

    async sendMessage(to: string, text: string, metadata: any = {}) {
        // Wrapper around existing robust service
        const response = await whatsappService.sendMessage(to, text, metadata);

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

    async validateContact(contact: string): Promise<boolean> {
        // Basic length check for now, real validation happens on send
        return contact.length >= 10;
    }
}
