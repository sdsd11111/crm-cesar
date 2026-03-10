import axios from 'axios';

async function verifyToken() {
    const token = process.env.META_WA_ACCESS_TOKEN;

    if (!token) {
        console.error('❌ No se encontró META_WA_ACCESS_TOKEN en .env');
        process.exit(1);
    }

    console.log('🔍 Verificando permisos del token...\n');

    try {
        // Endpoint para verificar permisos del token
        const response = await axios.get('https://graph.facebook.com/v21.0/me/permissions', {
            params: { access_token: token }
        });

        const permissions = response.data.data;

        console.log('📋 Permisos encontrados:\n');
        permissions.forEach((perm: any) => {
            const status = perm.status === 'granted' ? '✅' : '❌';
            console.log(`${status} ${perm.permission} (${perm.status})`);
        });

        // Verificar permisos críticos
        const hasMessaging = permissions.some((p: any) =>
            p.permission === 'whatsapp_business_messaging' && p.status === 'granted'
        );
        const hasManagement = permissions.some((p: any) =>
            p.permission === 'whatsapp_business_management' && p.status === 'granted'
        );

        console.log('\n📊 Resumen:');
        console.log(`whatsapp_business_messaging: ${hasMessaging ? '✅ OK' : '❌ FALTA'}`);
        console.log(`whatsapp_business_management: ${hasManagement ? '✅ OK' : '❌ FALTA'}`);

        if (hasMessaging && hasManagement) {
            console.log('\n🎉 ¡Token válido! Puedes subir medios.');
        } else {
            console.log('\n⚠️ Faltan permisos. Verifica la configuración en Meta.');
        }

    } catch (error: any) {
        console.error('❌ Error al verificar token:', error.response?.data || error.message);
    }
}

verifyToken();
