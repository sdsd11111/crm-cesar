
import { GoogleCalendarService } from '@/lib/google/CalendarService';

async function main() {
    try {
        console.log('📅 Testing GoogleCalendarService...');
        const calendar = new GoogleCalendarService();

        console.log('📋 Listing upcoming events...');
        const events = await calendar.listEvents(5);
        console.log(`✅ Found ${events?.length || 0} events.`);
        events?.forEach((e: any) => console.log(` - ${e.summary} (${e.start.dateTime || e.start.date})`));

        // Uncomment to test creation
        // console.log('➕ Creating test event...');
        // await calendar.createEvent('Test Donna', 'Creado por script de prueba', new Date().toISOString(), new Date(Date.now() + 3600000).toISOString());
        // console.log('✅ Event created.');

    } catch (error) {
        console.error('❌ Error:', error);
    }
}

main();
