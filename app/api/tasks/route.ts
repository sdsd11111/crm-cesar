import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { tasks, reminders } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export async function GET() {
  try {
    const allTasks = await db.select().from(tasks).orderBy(tasks.createdAt);

    // Map to camelCase
    const mappedTasks = allTasks.map((task: any) => ({
      id: task.id,
      title: task.title,
      description: task.description,
      status: task.status,
      priority: task.priority,
      dueDate: task.dueDate,
      reminderAt: task.reminderAt,
      assignedTo: task.assignedTo,
      relatedClientId: task.relatedClientId,
      relatedLeadId: task.relatedLeadId,
      createdAt: task.createdAt,
      updatedAt: task.updatedAt
    }));

    return NextResponse.json(mappedTasks);
  } catch (error) {
    console.error('Error fetching tasks:', error);
    return NextResponse.json({ error: 'Failed to fetch tasks' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    // 1. Insert Task
    const [newTask] = await db.insert(tasks).values({
      title: body.title,
      description: body.description,
      status: body.status || 'todo',
      priority: body.priority || 'medium',
      dueDate: body.dueDate ? new Date(body.dueDate) : null,
      reminderAt: body.reminderAt ? new Date(body.reminderAt) : null,
      assignedTo: body.assignedTo,
      contactId: body.contactId || body.relatedClientId || null,
      relatedClientId: body.relatedClientId || null,
      relatedLeadId: body.relatedLeadId || null
    }).returning();

    // 2. Insert Reminder if applicable
    if (body.reminderAt) {
      await db.insert(reminders).values({
        taskId: newTask.id,
        title: `Tarea: ${newTask.title}`,
        message: newTask.description || 'Recordatorio de tarea pendiente',
        sendAt: new Date(body.reminderAt),
        status: 'pending',
        channel: 'telegram'
      });
    }

    // 3. Trigger Donna Planning if contactId exists
    const contactId = newTask.contactId || newTask.relatedClientId || newTask.relatedLeadId;
    if (contactId) {
      try {
        const { planningEngine } = await import('@/lib/donna/services/PlanningEngine');
        await planningEngine.generatePlanningForContact(contactId);
      } catch (e) {
        console.error('⚠️ TasksAPI: Error triggering planning:', e);
      }
    }

    return NextResponse.json(newTask);
  } catch (error) {
    console.error('Error creating task:', error);
    return NextResponse.json({ error: 'Failed to create task' }, { status: 500 });
  }
}
