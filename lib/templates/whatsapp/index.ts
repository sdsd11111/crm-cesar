// Dynamic WhatsApp template loader
import dueno from './dueno';
import recepcion from './recepcion';
import noContesto from './no_contesto';
import info from './info';

export interface WhatsAppTemplate {
    id: string;
    label: string;
    text: string;
}

// Export all templates
export const WHATSAPP_TEMPLATES: Record<string, WhatsAppTemplate> = {
    owner: dueno,
    receptionist: recepcion,
    no_answer: noContesto,
    info: info,
};

// Helper function to replace placeholders
export function fillWhatsAppTemplate(template: WhatsAppTemplate, data: Record<string, string>): WhatsAppTemplate {
    let text = template.text;

    // Replace all placeholders
    Object.entries(data).forEach(([key, value]) => {
        const placeholder = `((${key.toUpperCase()}))`;
        text = text.replace(new RegExp(placeholder, 'g'), value);
    });

    return {
        id: template.id,
        label: template.label,
        text,
    };
}

// Get template list for UI
export const WHATSAPP_TEMPLATE_LIST = Object.values(WHATSAPP_TEMPLATES).map(t => ({
    id: t.id,
    label: t.label,
}));
