/**
 * Centralized WhatsApp Templates Registry
 * Define Meta Template Names and their required parameters here.
 */

export const WHATSAPP_TEMPLATES = {
    // Template for Birthday greetings
    BIRTHDAY: {
        name: 'felicitacion_cumpleanos_tribu', // MUST match Meta Panel
        buildComponents: (contactName: string) => [
            {
                type: 'body',
                parameters: [
                    { type: 'text', text: contactName }
                ]
            }
        ]
    },

    // Template for Commitment reminders
    COMMITMENT_REMINDER: {
        name: 'recordatorio_compromiso_donna',
        buildComponents: (contactName: string, commitment: string) => [
            {
                type: 'body',
                parameters: [
                    { type: 'text', text: contactName },
                    { type: 'text', text: commitment }
                ]
            }
        ]
    },

    // Generic fallback for starting a conversation
    WELOCME_TRIBU: {
        name: 'bienvenida_tribu_v1',
        buildComponents: (contactName: string) => [
            {
                type: 'body',
                parameters: [
                    { type: 'text', text: contactName }
                ]
            }
        ]
    }
};
