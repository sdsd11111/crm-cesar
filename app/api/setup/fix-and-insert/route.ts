import { NextResponse } from "next/server";
import { db } from '@/lib/db';
import { sql } from 'drizzle-orm';
import { contacts, contactChannels } from '@/lib/db/schema';
import { eq, or } from 'drizzle-orm';

export async function GET() {
    try {
        console.log("Starting Manual Repair and Insert...");

        // 1. Run Migration 015 logic
        await db.execute(sql`
        DO $$ 
        BEGIN
            -- Add missing columns to contacts if they don't exist
            IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='contacts' AND column_name='category_tags') THEN ALTER TABLE "contacts" ADD COLUMN "category_tags" text[] DEFAULT '{}'; END IF;
            IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='contacts' AND column_name='research_data') THEN ALTER TABLE "contacts" ADD COLUMN "research_data" jsonb; END IF;
            IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='contacts' AND column_name='client_id') THEN ALTER TABLE "contacts" ADD COLUMN "client_id" uuid; END IF;
            IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='contacts' AND column_name='channel_source') THEN ALTER TABLE "contacts" ADD COLUMN "channel_source" text DEFAULT 'whatsapp'; END IF;
            IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='contacts' AND column_name='last_activity_at') THEN ALTER TABLE "contacts" ADD COLUMN "last_activity_at" timestamp; END IF;
            IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='contacts' AND column_name='unread_count') THEN ALTER TABLE "contacts" ADD COLUMN "unread_count" integer DEFAULT 0; END IF;
            IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='contacts' AND column_name='updated_at') THEN ALTER TABLE "contacts" ADD COLUMN "updated_at" timestamp DEFAULT now(); END IF;
            IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='contacts' AND column_name='files') THEN ALTER TABLE "contacts" ADD COLUMN "files" text DEFAULT '[]'; END IF;
            IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='contacts' AND column_name='audio_transcriptions') THEN ALTER TABLE "contacts" ADD COLUMN "audio_transcriptions" text DEFAULT '[]'; END IF;
            -- Add all other potential missing columns from error log (Phase 2 check)
            IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='contacts' AND column_name='connection_type') THEN ALTER TABLE "contacts" ADD COLUMN "connection_type" text; END IF;
            IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='contacts' AND column_name='business_activity') THEN ALTER TABLE "contacts" ADD COLUMN "business_activity" text; END IF;
            IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='contacts' AND column_name='interested_product') THEN ALTER TABLE "contacts" ADD COLUMN "interested_product" text; END IF;
            IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='contacts' AND column_name='verbal_agreements') THEN ALTER TABLE "contacts" ADD COLUMN "verbal_agreements" text; END IF;
        END $$;
    `);

        // 2. Insert César Reyes Contact
        const testPhone = "0963410409";
        const testEmail = "objetivo.cesar@gmail.com";
        const testName = "César Reyes jaramillo";

        console.log("Inserting test contact...");

        // Check if exists
        const [existing] = await db.select().from(contacts)
            .where(or(eq(contacts.phone, testPhone), eq(contacts.email, testEmail)))
            .limit(1);

        let contactId;
        if (existing) {
            contactId = existing.id;
            await db.update(contacts).set({
                contactName: testName,
                entityType: 'lead',
                updatedAt: new Date()
            }).where(eq(contacts.id, contactId));
            console.log("Updated existing contact:", contactId);
        } else {
            const [inserted] = await db.insert(contacts).values({
                contactName: testName,
                phone: testPhone,
                email: testEmail,
                entityType: 'lead',
                businessName: 'IncaHD'
            } as any).returning();
            contactId = inserted.id;
            console.log("Inserted new contact:", contactId);
        }

        // 3. Ensure Channel
        const [channel] = await db.select().from(contactChannels)
            .where(eq(contactChannels.identifier, testPhone))
            .limit(1);

        if (!channel) {
            await db.insert(contactChannels).values({
                contactId,
                platform: 'whatsapp',
                identifier: testPhone,
                isPrimary: true
            });
            console.log("Created channel for test contact.");
        }

        return NextResponse.json({
            success: true,
            message: "Migration repair and Test Contact insertion complete!",
            contactId
        });

    } catch (error) {
        console.error("Manual Fix Error:", error);
        return NextResponse.json({ success: false, error: (error as Error).message }, { status: 500 });
    }
}
