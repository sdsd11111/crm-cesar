import axios from 'axios';

async function testManual() {
    const phoneNumberId = "976503285539774";
    const token = "EAANHzmMxvQABQVbKwP5Rgg9LxyEfBsQNIpfB3kl3JoV4ArwuBxFsfhSf6M6u5I5NU7aStra4gnXJwVMgEZAM0R79fl3mZB29mBZAj0JqjMPFCsrG4ZCXrMCzut9gcX8yPsCWItLkq7gjZCZB1qvPJULDcaIPQCetmXOf7KmPfunZAhmprnm0hJn55KRQqm4IQZDZD";
    const to = "593963410409";

    console.log(`🚀 Iniciando test manual con Phone ID: ${phoneNumberId}`);

    try {
        const response = await axios.post(
            `https://graph.facebook.com/v22.0/${phoneNumberId}/messages`,
            {
                messaging_product: "whatsapp",
                to: to,
                type: "template",
                template: {
                    name: "jaspers_market_plain_text_v1",
                    language: { code: "en_US" }
                }
            },
            {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            }
        );

        console.log('✅ EXITO EN EL ENVIO:');
        console.log(JSON.stringify(response.data, null, 2));
    } catch (error: any) {
        console.error('❌ ERROR EN EL ENVIO:');
        if (error.response) {
            console.error(JSON.stringify(error.response.data, null, 2));
        } else {
            console.error(error.message);
        }
    }
}

testManual();
