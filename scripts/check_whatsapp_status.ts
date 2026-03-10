import axios from 'axios';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

async function checkStatus() {
    const accessToken = process.env.META_WA_ACCESS_TOKEN;
    const phoneNumberId = process.env.META_WA_PHONE_NUMBER_ID;

    if (!accessToken || !phoneNumberId) {
        console.error('❌ Faltan credenciales en .env.local');
        return;
    }

    console.log(`🔍 Consultando estado para Phone Number ID: ${phoneNumberId}`);

    try {
        const response = await axios.get(
            `https://graph.facebook.com/v22.0/${phoneNumberId}`,
            {
                params: {
                    fields: 'status,display_phone_number,verified_name,quality_rating,code_verification_status'
                },
                headers: {
                    'Authorization': `Bearer ${accessToken}`
                }
            }
        );

        console.log('\n✅ RESPUESTA DE META:');
        console.log(JSON.stringify(response.data, null, 2));

        if (response.data.status === 'CONNECTED') {
            console.log('\n🟢 El número está CORRECTAMENTE registrado y conectado.');
        } else {
            console.log(`\n🟠 El estado actual es "${response.data.status}". Necesita registro.`);
        }

    } catch (error: any) {
        console.error('\n❌ ERROR AL CONSULTAR:');
        if (error.response) {
            console.error(JSON.stringify(error.response.data, null, 2));
        } else {
            console.error(error.message);
        }
    }
}

checkStatus();
