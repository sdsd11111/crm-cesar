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

    no_answer: (contactName: string) => `Buenos días ${contactName || '((NOMBRE))'}, Intenté contactarle hace un momento,
pero no logré comunicarme, somos una consultora especializada en el sector del turismo y le comparto concretamente como le podemos ayudar:

- Que un turista encuentre fácilmente su propuesta digital del hotel, su sistema de reservas, la propuesta de habitaciones, servicios complementarios y galería de fotos.
- Que su información salga en búsquedas en Google y por ChatGPT fácilmente a quien busque por ejemplo “hoteles cerca al cementerio”. (El 80% de los viajeros usan motores de búsqueda para planificar viajes).
- Estrategias de posicionamiento web para que las aplique con su equipo de marketing o los ejecute usted mismo. (El 57% de reservas online vienen de búsquedas orgánicas en Google).
Si le gustaría conocer cómo hacerlo, acá está cómo lo hacemos https://www.cesarreyesjaramillo.com/motor-reservas-hotel

¿Agendamos los 20 minutos?`,

    info: (contactName: string) => `${contactName || '((NOMBRE))'} como conversamos brevemente por teléfono, somos una consultora especializada en el sector del turismo y concretamente les ayudamos:

- Que un turista encuentre fácilmente su propuesta digital del hotel, su sistema de reservas, la propuesta de habitaciones, servicios complementarios y galería de fotos.
- Que su información salga en búsquedas en Google y por ChatGPT fácilmente a quien busque por ejemplo “hoteles cerca al cementerio”. (El 80% de los viajeros usan motores de búsqueda para planificar viajes).
- Estrategias de posicionamiento web para que las aplique con su equipo de marketing o los ejecute usted mismo. (El 57% de reservas online vienen de búsquedas orgánicas en Google).
Si le gustaría conocer cómo hacerlo, acá está cómo lo hacemos https://www.cesarreyesjaramillo.com/motor-reservas-hotel

¿Agendamos los 20 minutos?`
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
