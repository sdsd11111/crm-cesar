import { db } from '@/lib/db';
import { conversationalSessions } from '@/lib/db/schema';
import { eq, and, desc } from 'drizzle-orm';

export interface ConversationalSession {
    id: string;
    contactId: string | null;
    chatId: string;
    status: 'open' | 'reviewing' | 'paused' | 'closed' | 'abandoned';
    documentType: 'COTIZACION' | 'PROPUESTA' | 'CONTRATO';
    collectedData: any;
    lastGeneratedText: string | null;
    createdAt: Date;
    updatedAt: Date;
}

export class SessionManagerService {
    // Timeout threshold in minutes
    private readonly TIMEOUT_MINUTES = 60;

    /**
     * Finds the currently active ('open' or 'reviewing') session for a given chat.
     * Before returning, it checks if the session has timed out.
     */
    async getActiveSession(chatId: string): Promise<ConversationalSession | null> {
        const activeStatuses: string[] = ['open', 'reviewing'];

        // Get the latest session for this chat
        const [session] = await db
            .select()
            .from(conversationalSessions)
            .where(eq(conversationalSessions.chatId, chatId))
            .orderBy(desc(conversationalSessions.updatedAt))
            .limit(1);

        if (!session) return null;

        // Check if it's one of the active statuses
        if (!activeStatuses.includes(session.status)) return null;

        // Check for timeout
        const now = new Date();
        const updatedAt = new Date(session.updatedAt);
        const diffMinutes = (now.getTime() - updatedAt.getTime()) / (1000 * 60);

        if (diffMinutes > this.TIMEOUT_MINUTES) {
            console.log(`⏱️ [SessionManager] Session ${session.id} timed out. Changing to 'abandoned'.`);
            await this.updateSessionStatus(session.id, 'abandoned');
            return null;
        }

        return session as ConversationalSession;
    }

    /**
     * Creates a new session, ensuring any existing active sessions are paused.
     */
    async createSession(
        chatId: string,
        documentType: 'COTIZACION' | 'PROPUESTA' | 'CONTRATO',
        initialData: any = {},
        contactId?: string
    ): Promise<ConversationalSession> {
        // Enforce Single Hook Pattern: Auto-pause any existing active sessions
        const existingSession = await this.getActiveSession(chatId);
        if (existingSession) {
            console.log(`⏸️ [SessionManager] Auto-pausing existing session ${existingSession.id} to start a new one.`);
            await this.updateSessionStatus(existingSession.id, 'paused');
        }

        const [newSession] = await db
            .insert(conversationalSessions)
            .values({
                chatId,
                contactId: contactId || null,
                documentType,
                status: 'open',
                collectedData: initialData,
                updatedAt: new Date()
            })
            .returning();

        return newSession as ConversationalSession;
    }

    /**
     * Updates the collected JSON data of an open session.
     */
    async updateCollectedData(sessionId: string, newData: any): Promise<void> {
        await db
            .update(conversationalSessions)
            .set({
                collectedData: newData,
                updatedAt: new Date()
            })
            .where(eq(conversationalSessions.id, sessionId));
    }

    /**
     * Updates the text of the generated document and transitions the status to reviewing.
     */
    async setReviewingDocument(sessionId: string, textContent: string): Promise<void> {
        await db
            .update(conversationalSessions)
            .set({
                lastGeneratedText: textContent,
                status: 'reviewing',
                updatedAt: new Date()
            })
            .where(eq(conversationalSessions.id, sessionId));
    }

    /**
     * Modifies the status of a session (e.g., closing it).
     */
    async updateSessionStatus(sessionId: string, newStatus: 'open' | 'reviewing' | 'paused' | 'closed' | 'abandoned'): Promise<void> {
        await db
            .update(conversationalSessions)
            .set({
                status: newStatus,
                updatedAt: new Date()
            })
            .where(eq(conversationalSessions.id, sessionId));
    }

    /**
     * Helper to find a specific past session by contact if needed for re-opening
     */
    async findLastClosedSessionByContact(contactId: string): Promise<ConversationalSession | null> {
        const [session] = await db
            .select()
            .from(conversationalSessions)
            .where(
                and(
                    eq(conversationalSessions.contactId, contactId),
                    eq(conversationalSessions.status, 'closed')
                )
            )
            .orderBy(desc(conversationalSessions.updatedAt))
            .limit(1);

        return session as ConversationalSession | null;
    }
}

export const sessionManagerService = new SessionManagerService();
