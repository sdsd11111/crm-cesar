import axios from 'axios';

export class EvolutionWhatsAppService {
    private getCredentials() {
        return {
            apiUrl: process.env.EVOLUTION_API_URL || '',
            apiKey: process.env.EVOLUTION_API_KEY || '',
            instance: process.env.EVOLUTION_INSTANCE || ''
        };
    }

    async sendMessage(phone: string, text: string) {
        const { apiUrl, apiKey, instance } = this.getCredentials();
        const url = `${apiUrl}/message/sendText/${instance}`;

        const payload = {
            number: phone,
            options: {
                delay: 1200,
                presence: "composing",
                linkPreview: true
            },
            textMessage: {
                text: text
            }
        };

        const response = await axios.post(url, payload, {
            headers: {
                'apikey': apiKey,
                'Content-Type': 'application/json'
            }
        });

        return { success: true, data: response.data };
    }

    async sendDocument(phone: string, buffer: Buffer, fileName: string, caption?: string) {
        const { apiUrl, apiKey, instance } = this.getCredentials();
        const url = `${apiUrl}/message/sendMedia/${instance}`;

        // Evolution API uses base64 for media in some versions or Multipart
        // For sendMedia endpoint:
        const payload = {
            number: phone,
            mediaMessage: {
                mediatype: "document",
                caption: caption || "",
                media: buffer.toString('base64'),
                fileName: fileName
            }
        };

        const response = await axios.post(url, payload, {
            headers: {
                'apikey': apiKey,
                'Content-Type': 'application/json'
            }
        });

        return { success: true, data: response.data };
    }
}

export const evolutionWhatsAppService = new EvolutionWhatsAppService();
