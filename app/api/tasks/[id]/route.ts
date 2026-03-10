import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { tasks, reminders } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';

export async function PATCH(
    req: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const { id } = params;
        const body = await req.json();
        const { status } = body;

        if (!status) {
            return NextResponse.json(
                { error: 'Status is required' },
                { status: 400 }
            );
        }

        // Update task status
        await db
            .update(tasks)
            .set({ status, updatedAt: new Date() })
            .where(eq(tasks.id, id));

        // If task is completed or cancelled, cancel pending reminders
        if (status === 'done' || status === 'cancelled') {
            await db
                .update(reminders)
                .set({ status: 'cancelled', updatedAt: new Date() })
                .where(and(eq(reminders.taskId, id), eq(reminders.status, 'pending')));
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error updating task:', error);
        return NextResponse.json(
            { error: 'Failed to update task' },
            { status: 500 }
        );
    }
}
