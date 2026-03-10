import { messagingService } from '../MessagingService';
import { db } from '@/lib/db';
import { contacts } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

/**
 * Servicio especializado para la comunicación directa con prospectos y clientes.
 * Maneja la lógica de humanización (fragmentación) y selección de canal.
 */
export class CustomerMessagingService {
    /**
     * Envía un mensaje al cliente, manejando automáticamente la fragmentación
     * para simular una respuesta humana.
     */
    async sendHumanizedMessage(contactId: string, message: string, metadata: any = {}) {
        const sentences = message.split('\n\n').filter(s => s.trim().length > 0);

        for (let i = 0; i < sentences.length; i++) {
            const sentence = sentences[i].trim();
            await messagingService.send(contactId, sentence, metadata);

            // Simular delay humano entre mensajes (excepto el último)
            if (i < sentences.length - 1) {
                const delay = Math.min(sentence.length * 20, 1500);
                await new Promise(r => setTimeout(r, delay));
            }
        }

        return { success: true };
    }

    /**
     * Envía un mensaje directo (sin fragmentación).
     */
    async sendMessage(contactId: string, message: string, metadata: any = {}) {
        return messagingService.send(contactId, message, metadata);
    }

    /**
     * Pausa el bot para una intervención humana rápida.
     */
    async pauseBot(contactId: string) {
        await db.update(contacts)
            .set({ botMode: 'paused' } as any)
            .where(eq(contacts.id, contactId));
        console.log(`🤝 CustomerMessagingService: Bot paused for contact ${contactId}`);
    }
}

export const customerMessagingService = new CustomerMessagingService();
