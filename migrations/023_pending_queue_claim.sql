-- =============================================================================
-- MIGRATION 023: Pending Queue Claim Mechanism
-- Prevents multiple workers from processing the same chat batch simultaneously.
-- =============================================================================

ALTER TABLE pending_messages_queue 
ADD COLUMN IF NOT EXISTS claimed_at TIMESTAMP;

-- Index it for performance when querying unclaimed messages
CREATE INDEX IF NOT EXISTS idx_pending_queue_claimed_at ON pending_messages_queue(claimed_at);
