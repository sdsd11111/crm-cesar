import { db, schema } from '@/lib/db';
import { NextResponse } from 'next/server';
import { GoogleCalendarService } from '@/lib/google/CalendarService';

export async function GET() {
  try {
    const allEvents = await db.select().from(schema.events);
    return NextResponse.json(allEvents);
  } catch (error) {
    console.error('Error fetching events:', error);
    return NextResponse.json({ error: 'Failed to fetch events' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { googleSync, ...eventData } = body;

    // 1. Save to Local DB
    const newEvent = await db.insert(schema.events).values({
      ...eventData,
      startTime: new Date(eventData.startTime),
      endTime: new Date(eventData.endTime)
    }).returning();

    // 2. Optional Google Calendar Sync
    if (googleSync) {
      try {
        const calendar = new GoogleCalendarService();
        await calendar.createEvent(
          eventData.title,
          eventData.description || 'Agendado desde CRM Objetivo',
          new Date(eventData.startTime).toISOString(),
          new Date(eventData.endTime).toISOString(),
          eventData.attendees || [] // Expecting array of emails
        );
      } catch (calError) {
        console.error('Error syncing with Google Calendar:', calError);
        // We don't fail the whole request if only sync fails, but we could return a warning
      }
    }

    return NextResponse.json(newEvent[0]);
  } catch (error: any) {
    console.error('Error creating event:', error);
    return NextResponse.json({ error: 'Failed to create event', details: error.message }, { status: 500 });
  }
}
