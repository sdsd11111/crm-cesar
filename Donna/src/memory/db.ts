import { env } from "../config/env.js";
import admin from "firebase-admin";

// Initialize Firebase Admin SDK
// The GOOGLE_APPLICATION_CREDENTIALS environment variable should be set
// to the path of the service account key JSON file.
if (!admin.apps.length) {
    try {
        admin.initializeApp();
        console.log("Firebase Admin SDK initialized successfully");
    } catch (error) {
        console.error("Error initializing Firebase Admin SDK:", error);
    }
}

const db = admin.firestore();

export interface MessageRow {
    id: string;
    user_id: string;
    role: "system" | "user" | "assistant" | "tool";
    content: string;
    timestamp: string | FirebaseFirestore.Timestamp;
}

export const memory = {
    addMessage: async (userId: string, role: string, content: string) => {
        try {
            const messagesRef = db.collection('donna_messages');
            await messagesRef.add({
                user_id: userId,
                role: role,
                content: content,
                timestamp: admin.firestore.FieldValue.serverTimestamp()
            });
        } catch (error) {
            console.error("Error adding message to Firestore:", error);
        }
    },

    getHistory: async (userId: string, limit: number = 20): Promise<MessageRow[]> => {
        try {
            const messagesRef = db.collection('donna_messages');
            const q = messagesRef
                .where('user_id', '==', userId)
                .orderBy('timestamp', 'desc')
                .limit(limit);

            const snapshot = await q.get();
            const rows: MessageRow[] = [];

            snapshot.forEach(doc => {
                const data = doc.data();
                rows.push({
                    id: doc.id,
                    user_id: data.user_id,
                    role: data.role,
                    content: data.content,
                    timestamp: data.timestamp
                });
            });

            return rows.reverse(); // Return in chronological order
        } catch (error) {
            console.error("Error getting history from Firestore:", error);
            return [];
        }
    },

    clearHistory: async (userId: string) => {
        try {
            const messagesRef = db.collection('donna_messages');
            const q = messagesRef.where('user_id', '==', userId);
            const snapshot = await q.get();

            if (snapshot.empty) return;

            const batch = db.batch();
            snapshot.docs.forEach((doc) => {
                batch.delete(doc.ref);
            });
            await batch.commit();
        } catch (error) {
            console.error("Error clearing history in Firestore:", error);
        }
    }
};
