import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { leadsCapturarClientes } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { id, fullName, phone, location, referralSource, birthDate, suggestions, currentStep, status } = body;

        // Partial update logic handles any combination of fields provided

        if (id) {
            // Update existing lead
            const [updatedLead] = await db
                .update(leadsCapturarClientes)
                .set({
                    ...(fullName !== undefined && { fullName }),
                    ...(phone !== undefined && { phone }),
                    ...(location !== undefined && { location }),
                    ...(referralSource !== undefined && { referralSource }),
                    ...(birthDate !== undefined && { birthDate }),
                    ...(suggestions !== undefined && { suggestions }),
                    ...(currentStep !== undefined && { currentStep }),
                    ...(status !== undefined && { status }),
                    updatedAt: new Date(),
                })
                .where(eq(leadsCapturarClientes.id, id))
                .returning();

            return NextResponse.json({ success: true, lead: updatedLead });
        } else {
            // Create new lead
            const [newLead] = await db
                .insert(leadsCapturarClientes)
                .values({
                    fullName: fullName || null,
                    phone: phone || null,
                    location: location || null,
                    referralSource: referralSource || null,
                    birthDate: birthDate || null,
                    suggestions: suggestions || null,
                    currentStep: currentStep || 1,
                    status: status || 'incomplete',
                })
                .returning();

            return NextResponse.json({ success: true, lead: newLead });
        }
    } catch (error: any) {
        console.error('❌ Lead Capture API Error:', error);
        return NextResponse.json(
            { success: false, error: error.message || 'Internal Server Error' },
            { status: 500 }
        );
    }
}
