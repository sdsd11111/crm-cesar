export const TRAINER_WHATSAPP_TEMPLATES = {
    owner: (contactName: string) => `Hola ${contactName || '((NOMBRE))'}, buen día 😊
Tal como conversamos por teléfono, le comparto aquí la información.

En el enlace encontrará un video corto donde explico, de forma clara y práctica, cómo algunos hoteles están captando huéspedes nacionales y extranjeros y aumentando sus reservas directas, aprovechando su reputación en Google.

Revíselo con calma y, por favor, no dude en escribirme si le surge cualquier duda.
Un saludo desde Loja,
César Reyes

👉 https://cesarreyesjaramillo.com/motor-reservas-hotel#demo-video`,

    receptionist: () => `Hola, buen día 😊
Tal como conversamos por teléfono, le comparto este video corto (2 minutos) donde explico cómo algunos hoteles en Ecuador están captando más reservas directas desde Google, reduciendo la dependencia de plataformas.

👉 Este mensaje puede reenviarlo directamente al propietario o a la persona encargada del hotel.

Si lo consideran interesante, con gusto lo revisamos aplicado específicamente a su hotel.
Muchas gracias por su apoyo 🙏
César Reyes

👉 https://cesarreyesjaramillo.com/motor-reservas-hotel#demo-video`,

    no_answer: (contactName: string, businessName: string) => `Hola ${contactName || '((NOMBRE))'}, buen día 😊
Intenté llamarlo hace un momento,
pero no logré contactarlo.
Trabajo con hoteles en Ecuador
ayudándoles a captar reservas directas desde Google
y reducir la dependencia de Booking.
¿Le puedo enviar un video corto (2 minutos)
para que lo revise con calma
y vea si aplica para ${businessName || '((HOTEL))'}?
Quedo atento.
César Reyes`
};

/**
 * Helper function to safe replace variables even if the string is manually edited later
 */
export const replaceVariables = (text: string, variables: { contactName?: string, businessName?: string }) => {
    let newText = text;
    if (variables.contactName) newText = newText.replace(/\(\(NOMBRE\)\)/g, variables.contactName);
    if (variables.businessName) newText = newText.replace(/\(\(HOTEL\)\)/g, variables.businessName);
    return newText;
};
