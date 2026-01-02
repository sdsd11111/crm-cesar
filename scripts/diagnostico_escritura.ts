import { GoogleCalendarService } from '../lib/google/CalendarService';

async function diagnosticarEscritura() {
    console.log('🔍 DIAGNÓSTICO DE ESCRITURA EN GOOGLE CALENDAR\n');

    // Usar el email explícito como en el fix anterior
    const userEmail = 'objetivo.cesar@gmail.com';
    console.log(`🎯 Conectando al calendario: ${userEmail}`);
    const calendar = new GoogleCalendarService(userEmail);

    try {
        console.log('📝 Intentando crear un evento de prueba...');

        // Crear evento para dentro de 1 hora
        const now = new Date();
        const start = new Date(now.getTime() + 60 * 60 * 1000); // +1 hora
        const end = new Date(now.getTime() + 90 * 60 * 1000);   // +1.5 horas

        const evento = await calendar.createEvent(
            'TEST: Diagnóstico de Escritura Donna (Auto-retry)',
            'Este es un evento de prueba para verificar el fallback automático de Google Meet.',
            start.toISOString(),
            end.toISOString()
        );

        console.log('✅ ¡ÉXITO! Se pudo crear el evento.');
        console.log(`🔗 Link: ${evento.htmlLink}`);
        console.log(`🆔 ID: ${evento.id}\n`);

        console.log('🏁 Permisos de escritura VERIFICADOS CORRECTAMENTE.');

    } catch (error: any) {
        console.error('❌ ERROR AL CREAR EVENTO:');

        if (error.code === 403) {
            console.error('⛔ PERMISO DENEGADO (403)');
            console.log('\n📋 CAUSA Y SOLUCIÓN:');
            console.log('La cuenta de servicio tiene permiso de "Ver detalles", pero NO de "Realizar cambios".');
            console.log('1. Ve a Configuración de Google Calendar');
            console.log('2. Busca el usuario: donna-crm-bot@crm-v2-482422.iam.gserviceaccount.com');
            console.log('3. Cambia el permiso a: "Realizar cambios en los eventos"');
            console.log('4. Guarda y espera 1 minuto.');
        } else {
            console.error(error.message);
            console.error(error);
        }
    }
}

diagnosticarEscritura().catch(console.error);
