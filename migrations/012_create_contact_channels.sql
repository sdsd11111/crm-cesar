-- Migration: 012_create_contact_channels
-- Description: Creates the separate channels table for multi-platform identity

CREATE TABLE IF NOT EXISTS "contact_channels" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"contact_id" uuid NOT NULL REFERENCES "contacts"("id") ON DELETE CASCADE,
	"platform" text NOT NULL,
	"identifier" text NOT NULL,
	"is_primary" boolean DEFAULT false,
	"verified" boolean DEFAULT false,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
    UNIQUE("platform", "identifier")
);

CREATE INDEX IF NOT EXISTS "contact_channels_identifier_idx" ON "contact_channels" ("identifier");

-- Backfill Migration: Create channel entries for existing contacts
-- This ensures 'phone' numbers are immediately queryable in the new system
INSERT INTO "contact_channels" (contact_id, platform, identifier, is_primary, verified)
SELECT 
    id, 
    'whatsapp', -- Force default to 'whatsapp' since channel_source might not exist yet
    phone, 
    true, -- Make it primary
    true
FROM contacts 
WHERE phone IS NOT NULL AND phone != ''
ON CONFLICT (platform, identifier) DO NOTHING;
