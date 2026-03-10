// Dynamic email template loader
import primerContacto from './primer_contacto';
import seguimiento from './seguimiento';
import envioPropuesta from './envio_propuesta';
import agradecimiento from './agradecimiento';
import recordatorio from './recordatorio';

export interface EmailTemplate {
    id: string;
    subject: string;
    body: string;
}

// Export all templates
export const EMAIL_TEMPLATES: Record<string, EmailTemplate> = {
    primer_contacto: primerContacto,
    seguimiento: seguimiento,
    envio_propuesta: envioPropuesta,
    agradecimiento: agradecimiento,
    recordatorio: recordatorio,
};

// Helper function to replace placeholders
export function fillTemplate(template: EmailTemplate, data: Record<string, string>): EmailTemplate {
    let subject = template.subject;
    let body = template.body;

    // Replace all placeholders
    Object.entries(data).forEach(([key, value]) => {
        const placeholder = `((${key.toUpperCase()}))`;
        subject = subject.replace(new RegExp(placeholder, 'g'), value);
        body = body.replace(new RegExp(placeholder, 'g'), value);
    });

    return {
        id: template.id,
        subject,
        body,
    };
}

// Get template list for UI
export const EMAIL_TEMPLATE_LIST = Object.values(EMAIL_TEMPLATES).map(t => ({
    id: t.id,
    label: t.subject.replace(/\(\([A-Z]+\)\)/g, '...'),
}));
