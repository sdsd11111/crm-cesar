import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { donnaChatMessages } from '@/lib/db/schema';
import { desc, eq, sql } from 'drizzle-orm';

export async function GET() {
    try {
        // 1. Obtener todos los mensajes de WhatsApp de la campaña Donna
        const allMessages = await db.select()
            .from(donnaChatMessages)
            .where(
                sql`${donnaChatMessages.platform} = 'whatsapp' OR (${donnaChatMessages.platform} = 'telegram' AND ${donnaChatMessages.metadata}->>'platform' = 'whatsapp')`
            )
            .orderBy(desc(donnaChatMessages.messageTimestamp))
            .limit(500);

        const chatsMap = new Map();

        // 2. Agrupar por chatId (número de teléfono)
        for (const msg of allMessages) {
            const chatId = msg.chatId;

            if (!chatId) continue;
            if (chatsMap.has(chatId)) continue; // Solo nos importa el mensaje más reciente

            // 3. Determinar Estado basado en el contenido y rol
            let status = 'inbox';
            const contentNormalized = (msg.content || '').toLowerCase();
            const hotWords = ['precio', 'comprar', 'interesado', 'costo', 'pagar', 'urgente', 'ayuda'];

            if (msg.role === 'assistant') {
                status = 'donna'; // Mensaje enviado por Donna
            } else if (hotWords.some(word => contentNormalized.includes(word))) {
                status = 'urgent'; // Mensaje del usuario con palabras clave urgentes
            } else if (msg.role === 'user') {
                status = 'inbox'; // Mensaje normal del usuario
            }

            // 4. Crear el objeto del chat
            chatsMap.set(chatId, {
                id: chatId,
                entityId: null, // No hay entidad asociada en campaña
                entityType: 'campaign', // Tipo especial para campaña
                contactName: chatId, // Usar el número como nombre por defecto
                phone: chatId,
                lastMessage: msg.content || '',
                status: status,
                time: msg.messageTimestamp,
                messageType: 'whatsapp',
                metadata: msg.metadata,
                unread: msg.role === 'user', // Marcar como no leído si es del usuario
                isGhost: true // Siempre es "ghost" en campaña (sin entidad CRM)
            });
        }

        const uniqueChats = Array.from(chatsMap.values());

        return NextResponse.json({ success: true, chats: uniqueChats });
    } catch (error: any) {
        console.error('Error fetching campaign chats:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
