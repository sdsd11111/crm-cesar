import { GoogleCalendarService } from '../lib/google/CalendarService';

async function diagnosticarCalendario() {
    console.log('🔍 DIAGNÓSTICO DE GOOGLE CALENDAR\n');

    // INTENTO 1: Usar el email del usuario como Calendar ID explícito
    // 'primary' consulta el calendario de la Service Account (que está vacío)
    const userEmail = 'objetivo.cesar@gmail.com';
    console.log(`🎯 Intentando acceder al calendario explícito: ${userEmail}`);
    const calendar = new GoogleCalendarService(userEmail);

    // Test 1: Listar TODOS los eventos de los próximos 30 días
    console.log('📅 Test 1: Listando TODOS los eventos de los próximos 30 días...\n');
    const now = new Date();
    const futuro = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    try {
        const eventos = await calendar.listEvents(
            now.toISOString(),
            futuro.toISOString(),
            100 // Máximo 100 eventos
        );

        console.log(`✅ Eventos encontrados: ${eventos?.length || 0}\n`);

        if (eventos && eventos.length > 0) {
            eventos.forEach((evento: any, idx: number) => {
                console.log(`Evento ${idx + 1}:`);
                console.log(`  Título: ${evento.summary}`);
                console.log(`  Inicio: ${evento.start?.dateTime || evento.start?.date || 'N/A'}`);
                console.log(`  Fin: ${evento.end?.dateTime || evento.end?.date || 'N/A'}`);
                console.log(`  Tipo: ${evento.start?.dateTime ? 'Con hora específica' : 'Todo el día'}`);
                console.log('');
            });
        } else {
            console.log('⚠️ NO SE ENCONTRARON EVENTOS');
            console.log('\nPosibles causas:');
            console.log('1. La cuenta de servicio no tiene acceso al calendario');
            console.log('2. El calendario está vacío');
            console.log('3. Estás buscando en el calendario equivocado\n');
        }

    } catch (error: any) {
        console.error('❌ ERROR AL CONSULTAR CALENDARIO:');
        console.error(error.message);
        console.error('\nDetalles del error:');
        console.error(error);

        console.log('\n🔧 SOLUCIÓN:');
        console.log('1. Verifica que google_credentials.json existe y es válido');
        console.log('2. Comparte tu calendario con el email de la cuenta de servicio');
        console.log('3. El email de la cuenta de servicio está en google_credentials.json (campo "client_email")');
    }

    // Test 2: Buscar específicamente el 8 de enero
    console.log('\n📅 Test 2: Buscando eventos el 8 de enero de 2026...\n');

    // FIX: Crear fecha en hora local explícitamente y setear a media noche
    // En JS new Date(yyyy, mm, dd) crea fecha local a las 00:00:00
    // Nota: mm es 0-indexed (0 = Enero)
    const inicio8 = new Date(2026, 0, 8, 0, 0, 0, 0);

    // Crear fecha de fin clonando la de inicio y moviéndola al final del día
    const fin8 = new Date(inicio8);
    fin8.setHours(23, 59, 59, 999);

    console.log(`Buscando entre:`);
    console.log(`  Inicio (local): ${inicio8.toLocaleString('es-EC', { timeZone: 'America/Guayaquil' })}`);
    console.log(`  Inicio (ISO): ${inicio8.toISOString()}`);
    console.log(`  Fin (local): ${fin8.toLocaleString('es-EC', { timeZone: 'America/Guayaquil' })}`);
    console.log(`  Fin (ISO): ${fin8.toISOString()}\n`);

    try {
        const eventos8 = await calendar.listEvents(
            inicio8.toISOString(),
            fin8.toISOString()
        );

        console.log(`✅ Eventos encontrados: ${eventos8?.length || 0}\n`);

        if (eventos8 && eventos8.length > 0) {
            eventos8.forEach((evento: any, idx: number) => {
                console.log(`Evento ${idx + 1}:`);
                console.log(`  Título: ${evento.summary}`);
                console.log(`  Inicio: ${evento.start?.dateTime || evento.start?.date}`);
                console.log(`  Fin: ${evento.end?.dateTime || evento.end?.date}`);
                console.log('');
            });
        } else {
            console.log('⚠️ NO SE ENCONTRARON EVENTOS PARA EL 8 DE ENERO');
        }

    } catch (error: any) {
        console.error('❌ ERROR:', error.message);
    }

    // Test 3: Información de la cuenta de servicio
    console.log('\n🔑 Test 3: Información de la cuenta de servicio...\n');
    try {
        const fs = await import('fs');
        const path = await import('path');
        const credPath = path.join(process.cwd(), 'google_credentials.json');
        const creds = JSON.parse(fs.readFileSync(credPath, 'utf-8'));

        console.log(`Email de la cuenta de servicio: ${creds.client_email}`);
        console.log(`\n📋 INSTRUCCIONES:`);
        console.log(`1. Abre Google Calendar en tu navegador`);
        console.log(`2. Ve a Configuración > Configuración de "Mi Calendario"`);
        console.log(`3. En "Compartir con personas específicas", agrega:`);
        console.log(`   ${creds.client_email}`);
        console.log(`4. Dale permisos de "Ver todos los detalles del evento"`);
        console.log(`5. Guarda y espera 1-2 minutos para que se propague\n`);

    } catch (error) {
        console.error('❌ No se pudo leer google_credentials.json');
    }
}

diagnosticarCalendario().catch(console.error);
