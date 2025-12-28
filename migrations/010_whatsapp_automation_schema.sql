-- Migration: 010_whatsapp_automation_schema.sql
-- Description: Adds fields for WhatsApp automation and Donna's planning logic

-- 1. Update contacts table
ALTER TABLE contacts 
ADD COLUMN IF NOT EXISTS birthday DATE,
ADD COLUMN IF NOT EXISTS category_tags TEXT[] DEFAULT '{}';

-- 2. Index for birthday to optimize daily queries
CREATE INDEX IF NOT EXISTS idx_contacts_birthday ON contacts(birthday);

-- 3. Ensure loyalty_missions exists (it was defined in schema but maybe not in a migration yet)
-- Check if it exists first
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename  = 'loyalty_missions') THEN
        CREATE TABLE loyalty_missions (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            source TEXT CHECK (source IN ('micro', 'macro')) NOT NULL,
            status TEXT CHECK (status IN ('pending', 'approved', 'scheduled', 'executed', 'cancelled')) NOT NULL DEFAULT 'pending',
            planned_at TIMESTAMP WITH TIME ZONE,
            contact_id UUID REFERENCES contacts(id) ON DELETE CASCADE,
            content TEXT NOT NULL,
            metadata JSONB DEFAULT '{}'::jsonb,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
    END IF;
END $$;

-- 4. Index for missions
CREATE INDEX IF NOT EXISTS idx_loyalty_missions_status ON loyalty_missions(status);
CREATE INDEX IF NOT EXISTS idx_loyalty_missions_planned_at ON loyalty_missions(planned_at);
CREATE INDEX IF NOT EXISTS idx_loyalty_missions_contact_id ON loyalty_missions(contact_id);

COMMENT ON COLUMN contacts.category_tags IS 'Tags para segmentación inteligente (ej. Médico, Ingeniero, Dueño de Hotel)';
