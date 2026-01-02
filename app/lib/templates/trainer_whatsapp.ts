export const TRAINER_WHATSAPP_TEMPLATES = {
    owner: (contactName: string, businessName: string = '((HOTEL))') => `Hola ${contactName || '((NOMBRE))'}, un gusto saludarle 😊
Tal como conversamos, le comparto la información de la reunión:
((PEGAR LA INFORMACIÓN DEL AGENDAMIENTO))

Importante:
En Objetivo ayudamos a alojamientos como ${businessName}
a no perder todas las comisiones que normalmente pagan a plataformas,
captando más reservas directas desde Google.

Saludos,
César Reyes`,

    receptionist: (businessName: string = '((HOTEL))') => `Hola, buen día 😊
Tal como conversamos por teléfono,
en Objetivo ayudamos a alojamientos como ${businessName}
a reducir las comisiones que pagan a plataformas,
captando más reservas directas desde Google.

Para que puedan revisar la propuesta,
le dejo mi página web:
👉 https://cesarreyesjaramillo.com/motor-reservas-hotel#demo-video

Este mensaje puede reenviarlo directamente
al propietario o a la persona encargada del hotel.

Si lo consideran interesante,
con gusto lo revisamos aplicado específicamente a su hotel.

Muchas gracias por su apoyo 🙏
César Reyes`,

    no_answer: (contactName: string, businessName: string) => `Hola ${contactName || '((NOMBRE))'}, buen día 😊
Intenté contactarle hace un momento,
pero no logré comunicarme.
Trabajo con hoteles en Ecuador
ayudándoles a captar reservas directas desde Google
y reducir la dependencia de Booking.
¿Le puedo enviar un video corto
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
