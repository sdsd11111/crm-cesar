import { db } from '@/lib/db';
import * as schema from '@/lib/db/schema';
import { NextResponse } from 'next/server';

export async function GET() {
    try {
        const templates = await db
            .select()
            .from(schema.contractTemplates)
            .orderBy(schema.contractTemplates.name);

        return NextResponse.json(templates);
    } catch (error) {
        console.error('Error fetching templates:', error);
        return NextResponse.json(
            { error: 'Failed to fetch templates' },
            { status: 500 }
        );
    }
}

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const newTemplate = await db
            .insert(schema.contractTemplates)
            .values({
                slug: body.slug,
                name: body.name,
                description: body.description,
                fields: body.fields,
                contentTemplate: body.contentTemplate,
            })
            .returning();

        return NextResponse.json(newTemplate[0]);
    } catch (error) {
        console.error('Error creating template:', error);
        return NextResponse.json(
            { error: 'Failed to create template' },
            { status: 500 }
        );
    }
}
