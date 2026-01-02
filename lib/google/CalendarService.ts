import { google } from 'googleapis';
import path from 'path';

// Scopes required for the Google Calendar API
const SCOPES = ['https://www.googleapis.com/auth/calendar'];

// Path to the service account key file
const KEY_FILE_PATH = path.join(process.cwd(), 'google_credentials.json');

export class GoogleCalendarService {
    private calendar;
    private calendarId: string;

    constructor(calendarId: string = 'primary') {
        const credentialsVar = process.env.GOOGLE_CALENDAR_CREDENTIALS;
        let authOptions: any = {
            scopes: SCOPES,
        };

        if (credentialsVar) {
            try {
                // If the variable is a JSON string, parse it
                const credentials = JSON.parse(credentialsVar);
                authOptions.credentials = credentials;
                console.log('🔐 [GoogleCalendarService] Using credentials from environment variable');
            } catch (e) {
                console.error('❌ [GoogleCalendarService] Error parsing GOOGLE_CALENDAR_CREDENTIALS:', e);
                authOptions.keyFile = KEY_FILE_PATH;
            }
        } else {
            console.log('📄 [GoogleCalendarService] Using credentials from local file:', KEY_FILE_PATH);
            authOptions.keyFile = KEY_FILE_PATH;
        }

        const auth = new google.auth.GoogleAuth(authOptions);
        this.calendar = google.calendar({ version: 'v3', auth });
        this.calendarId = calendarId;
    }

    /**
     * Creates a new event in the Google Calendar.
     * @param summary Title of the event
     * @param description Description or details
     * @param startTime ISO string of start time
     * @param endTime ISO string of end time
     * @param attendees Array of email strings
     * @param timeZone Default 'America/Guayaquil'
     */
    async createEvent(
        summary: string,
        description: string,
        startTime: string,
        endTime: string,
        attendees: string[] = [],
        timeZone: string = 'America/Guayaquil'
    ) {
        const eventBody = {
            summary,
            description,
            start: {
                dateTime: startTime,
                timeZone: timeZone,
            },
            end: {
                dateTime: endTime,
                timeZone: timeZone,
            },
            attendees: attendees.map((email) => ({ email })),
        };

        try {
            // Intento 1: Crear con Google Meet
            const eventWithMeet = {
                ...eventBody,
                conferenceData: {
                    createRequest: {
                        requestId: Math.random().toString(36).substring(7),
                        conferenceSolutionKey: { type: 'hangoutsMeet' },
                    },
                },
            };

            const res = await this.calendar.events.insert({
                calendarId: this.calendarId,
                requestBody: eventWithMeet,
                conferenceDataVersion: 1,
            });

            console.log('Event created with Meet: %s', res.data.htmlLink);
            return res.data;
        } catch (error: any) {
            // Si falla por configuración de conferencia (400), reintentar sin Meet
            if (error.code === 400 || error.message?.includes('conference')) {
                console.warn('⚠️ Falló creación con Meet, reintentando evento simple...', error.message);

                const res = await this.calendar.events.insert({
                    calendarId: this.calendarId,
                    requestBody: eventBody,
                    // Sin conferenceDataVersion
                });

                console.log('Event created (Simple): %s', res.data.htmlLink);
                return res.data;
            }

            console.error('Error creating event in Google Calendar:', error);
            throw error;
        }
    }

    async listEvents(timeMin?: string, timeMax?: string, maxResults: number = 10) {
        const now = new Date().toISOString();
        const res = await this.calendar.events.list({
            calendarId: this.calendarId,
            timeMin: timeMin || now,
            timeMax: timeMax,
            maxResults,
            singleEvents: true,
            orderBy: 'startTime',
        });
        return res.data.items || [];
    }

    async deleteEvent(eventId: string) {
        try {
            await this.calendar.events.delete({
                calendarId: this.calendarId,
                eventId: eventId,
            });
            console.log('Event deleted: %s', eventId);
            return true;
        } catch (error) {
            console.error('Error deleting event:', error);
            throw error;
        }
    }
}
