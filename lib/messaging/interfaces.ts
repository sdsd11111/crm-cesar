
export interface IMessagingAdapter {
    /**
     * Unique identifier for the provider (e.g., 'whatsapp', 'telegram')
     */
    providerId: string;

    /**
     * Sends a text message to a phone number or chat ID.
     */
    sendMessage(to: string, text: string, metadata?: any): Promise<{ success: boolean; data?: any; error?: string }>;

    /**
     * Sends a template message (specific to WA, but optional for others).
     */
    sendTemplate?(to: string, templateName: string, language?: string, components?: any[]): Promise<any>;

    /**
     * Validates if the phone number/ID is valid for this channel.
     */
    validateContact(contact: string): Promise<boolean>;
}
