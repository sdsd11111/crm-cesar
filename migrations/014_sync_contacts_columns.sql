
-- Migration to synchronize contacts table with the latest Omnichannel schema
DO $$ 
BEGIN
    -- Add category_tags if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='contacts' AND column_name='category_tags') THEN
        ALTER TABLE "contacts" ADD COLUMN "category_tags" text[] DEFAULT '{}';
    END IF;

    -- Add research_data if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='contacts' AND column_name='research_data') THEN
        ALTER TABLE "contacts" ADD COLUMN "research_data" jsonb;
    END IF;

    -- Add client_id if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='contacts' AND column_name='client_id') THEN
        ALTER TABLE "contacts" ADD COLUMN "client_id" uuid;
    END IF;

    -- Add channel_source if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='contacts' AND column_name='channel_source') THEN
        ALTER TABLE "contacts" ADD COLUMN "channel_source" text DEFAULT 'whatsapp';
    END IF;

    -- Add last_activity_at if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='contacts' AND column_name='last_activity_at') THEN
        ALTER TABLE "contacts" ADD COLUMN "last_activity_at" timestamp;
    END IF;

    -- Add unread_count if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='contacts' AND column_name='unread_count') THEN
        ALTER TABLE "contacts" ADD COLUMN "unread_count" integer DEFAULT 0;
    END IF;

    -- Ensure updated_at exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='contacts' AND column_name='updated_at') THEN
        ALTER TABLE "contacts" ADD COLUMN "updated_at" timestamp DEFAULT now();
    END IF;
END $$;
