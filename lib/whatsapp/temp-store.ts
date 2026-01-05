// lib/whatsapp/temp-store.ts
// Singleton to store recent WhatsApp interactions without database persistence

interface TempLog {
    id: string;
    type: string;
    direction: 'inbound' | 'outbound';
    content: string;
    performedAt: string;
    createdAt: string;
    metadata: any;
}

class WhatsAppTempStore {
    private static instance: WhatsAppTempStore;
    private logs: TempLog[] = [];
    private readonly MAX_LOGS = 50;

    private constructor() { }

    public static getInstance(): WhatsAppTempStore {
        if (!WhatsAppTempStore.instance) {
            WhatsAppTempStore.instance = new WhatsAppTempStore();
        }
        return WhatsAppTempStore.instance;
    }

    public addLog(log: Omit<TempLog, 'createdAt' | 'id'>) {
        const newLog: TempLog = {
            ...log,
            id: Math.random().toString(36).substring(7),
            createdAt: new Date().toISOString()
        };
        this.logs.unshift(newLog); // Newest first
        if (this.logs.length > this.MAX_LOGS) {
            this.logs.pop();
        }
        console.log(`[TEMP_STORE] Added ${log.direction} message: ${log.content.substring(0, 30)}...`);
    }

    public getLogs(): TempLog[] {
        return this.logs;
    }

    public clear() {
        this.logs = [];
    }
}

// In Next.js, we need to handle the global object to keep the singleton across HMR during development
const globalForWA = global as unknown as { waTempStore: WhatsAppTempStore };
export const waTempStore = globalForWA.waTempStore || WhatsAppTempStore.getInstance();

if (process.env.NODE_ENV !== 'production') globalForWA.waTempStore = waTempStore;
