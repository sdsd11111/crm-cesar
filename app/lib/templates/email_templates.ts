// Email Templates for CRM
// These templates can be used across Trainer, Leads, and Clients

export const EMAIL_TEMPLATES = {
    presentacion: (contactName: string = '', businessName: string = '') => ({
        subject: `Posicionamiento Real para ${businessName || '((HOTEL))'}`,
        body: `Estimado/a ${contactName || '((NOMBRE))'
            },

Mi nombre es César Reyes y soy consultor especializado en el sector turístico ecuatoriano.

Me comunico con usted porque he identificado que ${businessName || '((HOTEL))'} tiene un gran potencial de crecimiento en el mercado digital.

**¿En qué podemos ayudarle?**
- Posicionamiento en Google y Booking
- Estrategias de marketing digital especializadas en turismo
- Optimización de presencia online
- Incremento de reservas directas

Me gustaría agendar una breve llamada de 15 minutos para conocer sus objetivos y mostrarle cómo podemos ayudarle a alcanzarlos.

¿Cuándo sería un buen momento para conversar?

Saludos cordiales,

**César Reyes**
Posicionamiento Real - Consultoría Turística
📧 turismo@cesarreyesjaramillo.com
📱 WhatsApp: [Tu número]
🌐 www.cesarreyesjaramillo.com`
    }),

    seguimiento: (contactName: string = '', businessName: string = '') => ({
        subject: `Seguimiento - ${businessName || '((HOTEL))'}`,
        body: `Hola ${contactName || '((NOMBRE))'},

Espero que se encuentre muy bien.

Le escribo para dar seguimiento a nuestra conversación reciente sobre las oportunidades de crecimiento para ${businessName || '((HOTEL))'}.

Como comentamos, podemos ayudarle con:
✓ Incrementar su visibilidad online
✓ Mejorar su posicionamiento en buscadores
✓ Optimizar su estrategia de reservas

¿Le gustaría que agendemos una reunión para profundizar en estos temas?

Quedo atento a sus comentarios.

Saludos,

**César Reyes**
Posicionamiento Real
turismo@cesarreyesjaramillo.com`
    }),

    propuesta: (contactName: string = '', businessName: string = '') => ({
        subject: `Propuesta Comercial - ${businessName || '((HOTEL))'}`,
        body: `Estimado/a ${contactName || '((NOMBRE))'},

Adjunto encontrará nuestra propuesta comercial personalizada para ${businessName || '((HOTEL))'}.

Hemos diseñado un plan estratégico que se adapta a sus necesidades específicas y objetivos de crecimiento.

**Próximos pasos:**
1. Revisar la propuesta adjunta
2. Agendar una reunión para resolver dudas
3. Definir plan de acción

Estoy disponible para cualquier consulta o aclaración que necesite.

Saludos cordiales,

**César Reyes**
Posicionamiento Real
📧 turismo@cesarreyesjaramillo.com`
    }),

    recordatorio: (contactName: string = '', businessName: string = '', meetingDate: string = '') => ({
        subject: `Recordatorio: Reunión ${businessName || '((HOTEL))'}`,
        body: `Hola ${contactName || '((NOMBRE))'},

Le recuerdo nuestra reunión programada para ${meetingDate || '((FECHA))'}.

**Agenda:**
- Revisión de objetivos
- Presentación de estrategia
- Plan de implementación

Si necesita reagendar, por favor háganmelo saber con anticipación.

¡Nos vemos pronto!

Saludos,

**César Reyes**
Posicionamiento Real`
    }),

    agradecimiento: (contactName: string = '', businessName: string = '') => ({
        subject: `¡Gracias por confiar en nosotros!`,
        body: `Estimado/a ${contactName || '((NOMBRE))'},

Quiero agradecerle personalmente por confiar en Posicionamiento Real para impulsar el crecimiento de ${businessName || '((HOTEL))'}.

Estamos comprometidos en brindarle los mejores resultados y superar sus expectativas.

En los próximos días estaremos en contacto para iniciar con el plan acordado.

Si tiene alguna pregunta, no dude en contactarme.

¡Bienvenido/a a la familia Posicionamiento Real!

Saludos cordiales,

**César Reyes**
Posicionamiento Real
turismo@cesarreyesjaramillo.com`
    }),

    informacion: (contactName: string = '', businessName: string = '') => ({
        subject: `Información Solicitada - Posicionamiento Real`,
        body: `Hola ${contactName || '((NOMBRE))'},

Como conversamos, le envío información detallada sobre nuestros servicios de consultoría turística.

**Nuestros Servicios:**
🎯 Posicionamiento en Google y Booking
📊 Marketing Digital Especializado
💼 Consultoría Estratégica
📈 Optimización de Conversiones

**Casos de Éxito:**
Hemos trabajado con más de 50 establecimientos turísticos en Ecuador, logrando incrementos promedio del 40% en reservas directas.

¿Le gustaría conocer más detalles sobre cómo podemos ayudar a ${businessName || '((HOTEL))'}?

Quedo atento a sus comentarios.

Saludos,

**César Reyes**
Posicionamiento Real
📧 turismo@cesarreyesjaramillo.com
📱 WhatsApp: [Tu número]`
    })
};

// Helper to get template list for UI
export const EMAIL_TEMPLATE_LIST = [
    { id: 'presentacion', label: '📧 Presentación Inicial' },
    { id: 'seguimiento', label: '🔄 Seguimiento' },
    { id: 'propuesta', label: '📄 Envío de Propuesta' },
    { id: 'recordatorio', label: '⏰ Recordatorio' },
    { id: 'agradecimiento', label: '🙏 Agradecimiento' },
    { id: 'informacion', label: 'ℹ️ Envío de Información' }
] as const;
