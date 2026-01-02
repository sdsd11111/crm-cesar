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
        // If using a service account with domain-wide delegation, you might need to impersonate a user.
        // However, for simple sharing (User shares calendar with Service Account Email),
        // we just use the Service Account Auth directly.

        const auth = new google.auth.GoogleAuth({
            keyFile: KEY_FILE_PATH,
            scopes: SCOPES,
        });

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
        try {
            const event = {
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
                // Add Google Meet link automatically if conferenceDataVersion is 1
                conferenceData: {
                    createRequest: {
                        requestId: Math.random().toString(36).substring(7),
                        conferenceSolutionKey: { type: 'hangoutsMeet' },
                    },
                },
            };

            const res = await this.calendar.events.insert({
                calendarId: this.calendarId,
                requestBody: event,
                conferenceDataVersion: 1, // Request Meet link generation
            });

            console.log('Event created: %s', res.data.htmlLink);
            return res.data;
        } catch (error) {
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
}
