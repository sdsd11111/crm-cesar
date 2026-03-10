
-- Migration: Add fields for Omnichannel and Identity Merging
-- Adds: client_id, channel_source, last_activity_at, unread_count to contacts table

ALTER TABLE contacts 
ADD COLUMN IF NOT EXISTS client_id UUID REFERENCES clients(id),
ADD COLUMN IF NOT EXISTS channel_source TEXT DEFAULT 'whatsapp',
ADD COLUMN IF NOT EXISTS last_activity_at TIMESTAMP,
ADD COLUMN IF NOT EXISTS unread_count INTEGER DEFAULT 0;

-- Create index for faster inbox sorting
CREATE INDEX IF NOT EXISTS idx_contacts_last_activity ON contacts(last_activity_at DESC);
CREATE INDEX IF NOT EXISTS idx_contacts_client_id ON contacts(client_id);
