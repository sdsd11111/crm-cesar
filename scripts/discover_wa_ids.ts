import axios from 'axios';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

async function listPhoneNumbers() {
    const accessToken = process.env.META_WA_ACCESS_TOKEN;

    // El WABA ID a veces es necesario para listar, pero intentaremos obtenerlo preguntando por el token
    console.log("🔍 Consultando información del token...");

    try {
        // 1. Obtener información de la app/cuenta asociada al token
        const me = await axios.get(`https://graph.facebook.com/v22.0/me`, {
            params: { access_token: accessToken }
        });
        console.log(`✅ Token asociado a: ${me.data.name} (ID: ${me.data.id})`);

        // 2. Intentar buscar cuentas de WhatsApp Business (WABA)
        // Nota: A veces se necesita el Business ID, pero probaremos con /me/accounts o similar
        console.log("\n🔍 Buscando cuentas de WhatsApp Business...");
        // Esta ruta suele devolver las WABAs si el token tiene permisos de management
        const wabaRes = await axios.get(`https://graph.facebook.com/v22.0/me/whatsapp_business_accounts`, {
            params: { access_token: accessToken }
        });

        if (wabaRes.data.data && wabaRes.data.data.length > 0) {
            for (const waba of wabaRes.data.data) {
                console.log(`\n📂 WABA Detectada: ${waba.name} (ID: ${waba.id})`);
                console.log(`   - Estado: ${waba.status}`);

                // 3. Listar números para cada WABA
                console.log(`   - 📱 Listando números...`);
                const numbersRes = await axios.get(`https://graph.facebook.com/v22.0/${waba.id}/phone_numbers`, {
                    params: {
                        access_token: accessToken,
                        fields: 'display_phone_number,verified_name,quality_rating,status,id,code_verification_status'
                    }
                });

                if (numbersRes.data.data && numbersRes.data.data.length > 0) {
                    numbersRes.data.data.forEach((num: any) => {
                        console.log(`     > Número: ${num.display_phone_number}`);
                        console.log(`       ID: ${num.id}`);
                        console.log(`       Nombre: ${num.verified_name}`);
                        console.log(`       Estado: ${num.status}`);
                        console.log(`       Verificación: ${num.code_verification_status}`);
                        console.log('       ---');
                    });
                } else {
                    console.log("     ⚠️ No se encontraron números en esta WABA.");
                }
            }
        } else {
            console.log("\n❌ No se encontraron Cuentas de WhatsApp Business asociadas al token.");
            console.log("Verifica que el System User tenga el permiso 'whatsapp_business_management'.");
        }

    } catch (error: any) {
        console.error('\n❌ ERROR CRÍTICO:');
        if (error.response) {
            console.error(JSON.stringify(error.response.data, null, 2));
        } else {
            console.error(error.message);
        }
    }
}

listPhoneNumbers();
