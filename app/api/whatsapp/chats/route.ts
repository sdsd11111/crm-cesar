import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { sql } from 'drizzle-orm';

export async function GET() {
    try {
        // 1. Obtener el mensaje más reciente de CADA chat_id de forma única y eficiente
        // Usamos DISTINCT ON para que PostgreSQL nos dé una sola fila por chatId
        // Ordenamos por chat_id y luego por message_timestamp DESC para quedarnos con el último de cada uno
        const latestMessages = await db.execute(sql`
            SELECT DISTINCT ON (chat_id) 
                id, chat_id, role, content, platform, message_timestamp, metadata
            FROM donna_chat_messages
            WHERE platform = 'whatsapp'
            ORDER BY chat_id, message_timestamp DESC
        `);

        // Convertir a array de objetos planos (execute retorna filas crudas)
        const allMessages = latestMessages as any[];

        // 2. Mapear al formato que espera la UI
        const chats = allMessages.map(msg => {
            const chatId = msg.chat_id;
            const content = msg.content || '';
            const role = msg.role;

            // Determinar Estatus
            let status = 'inbox';
            const contentNormalized = content.toLowerCase();
            const hotWords = ['precio', 'comprar', 'interesado', 'costo', 'pagar', 'urgente', 'ayuda'];

            if (role === 'assistant') {
                status = 'donna';
            } else if (hotWords.some(word => contentNormalized.includes(word))) {
                status = 'urgent';
            } else if (role === 'user') {
                status = 'inbox';
            }

            return {
                id: chatId,
                entityId: null,
                entityType: 'campaign',
                contactName: `Chat ${chatId.slice(-4)}`,
                phone: chatId,
                lastMessage: content,
                status: status,
                time: msg.message_timestamp,
                messageType: 'whatsapp',
                metadata: msg.metadata,
                unread: role === 'user',
                isGhost: true
            };
        });

        // 3. Ordenar la lista final por fecha (el más reciente de todos arriba)
        const sortedChats = chats.sort((a, b) =>
            new Date(b.time).getTime() - new Date(a.time).getTime()
        );

        return NextResponse.json({
            success: true,
            chats: sortedChats
        });

    } catch (error: any) {
        console.error('Error fetching campaign chats:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
