import { messagingService } from '../MessagingService';

/**
 * Servicio especializado para comunicaciones internas (César, Abel, Equipo).
 * Centraliza las alertas de conversión, recordatorios de tareas y avisos del sistema.
 */
export class InternalNotificationService {
    private readonly CESAR_CHAT_ID = process.env.TELEGRAM_CHAT_ID;

    /**
     * Envía una notificación directa a César.
     */
    async notifyCesar(message: string, metadata: any = {}) {
        if (!this.CESAR_CHAT_ID) {
            console.warn('⚠️ InternalNotificationService: No TELEGRAM_CHAT_ID configured.');
            return { success: false, error: 'Missing Telegram configuration' };
        }

        console.log('🔔 InternalNotificationService: Sending alert to César');
        return messagingService.send(this.CESAR_CHAT_ID, message, {
            type: 'internal_alert',
            ...metadata,
            platform: 'telegram', // Force Telegram for internal alerts
        });
    }

    /**
     * Envía una alerta de conversión de lead.
     */
    async notifyConversion(leadName: string, chatId: string, reason?: string) {
        const customContext = reason ? `\n\n📌 *Motivo:* ${reason}` : '';
        const alertText = `*⚡ ALERTA DE CONVERSIÓN*\n\n` +
            `👤 *Lead:* ${leadName}\n` +
            `📱 *Chat:* https://wa.me/${chatId.replace(/\D/g, '')}${customContext}\n\n` +
            `¡Momento de cerrar la venta! 🚀`;

        return this.notifyCesar(alertText, { type: 'conversion_alert' });
    }

    /**
     * Envía un recordatorio de tarea.
     */
    async sendReminder(title: string, message: string) {
        const reminderText = `🔔 *RECORDATORIO*\n\n*${title}*\n${message}`;
        return this.notifyCesar(reminderText, { type: 'task_reminder' });
    }
}

export const internalNotificationService = new InternalNotificationService();
