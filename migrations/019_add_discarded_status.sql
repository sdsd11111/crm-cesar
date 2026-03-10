-- Migration: Add 'discarded' status to discovery_leads
-- This migration updates the check constraint for the status column in the discovery_leads table.

ALTER TABLE discovery_leads DROP CONSTRAINT IF EXISTS discovery_leads_status_check;
ALTER TABLE discovery_leads ADD CONSTRAINT discovery_leads_status_check CHECK (status IN ('pending', 'investigated', 'no_answer', 'not_interested', 'sent_info', 'converted', 'discarded'));
