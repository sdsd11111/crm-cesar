import { GoogleCalendarService } from '../lib/google/CalendarService';

async function cleanupTestEvents() {
    console.log('🧹 LIMPIEZA DE EVENTOS DE PRUEBA\n');

    // Conexión segura al calendario correcto
    const userEmail = 'objetivo.cesar@gmail.com';
    const calendar = new GoogleCalendarService(userEmail);

    console.log(`🔍 Buscando eventos de prueba en: ${userEmail}\n`);

    // Listar eventos del próximo mes
    const now = new Date();
    const future = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); // 30 días

    try {
        const events = await calendar.listEvents(
            now.toISOString(),
            future.toISOString(),
            50
        );

        if (!events || events.length === 0) {
            console.log('✅ No se encontraron eventos para revisar.');
            return;
        }

        let deletedCount = 0;

        for (const event of events) {
            // CRÍTICO: Identificar solo el evento de prueba por su título exacto
            if (event.summary && event.summary.includes('TEST: Diagnóstico de Escritura Donna')) {
                console.log(`🗑️ Encontrado evento de prueba: "${event.summary}"`);
                console.log(`   Fecha: ${event.start?.dateTime}`);
                console.log(`   ID: ${event.id}`);

                // Borrar
                await calendar.deleteEvent(event.id);
                console.log(`   ✅ ¡ELIMINADO CORRECTAMENTE!`);

                deletedCount++;
            } else {
                // Confirmar que NO tocamos otros eventos
                console.log(`🛡️ Conservando evento real: "${event.summary}" (${event.start?.dateTime})`);
            }
        }

        console.log(`\n🎉 Limpieza completada. total eliminados: ${deletedCount}`);

    } catch (error: any) {
        console.error('❌ Error durante la limpieza:', error.message);
    }
}

cleanupTestEvents().catch(console.error);
