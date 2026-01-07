
-- Table to prevent duplicate processing of webhook events (Idempotency)
CREATE TABLE IF NOT EXISTS "webhook_events_processed" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    "provider" text NOT NULL, -- 'telegram', 'whatsapp', 'instagram'
    "external_id" text NOT NULL, -- update_id or message_id
    "processed_at" timestamp DEFAULT now(),
    UNIQUE("provider", "external_id")
);

-- Index for fast lookup
CREATE INDEX IF NOT EXISTS "idx_webhook_events_external" ON "webhook_events_processed" ("provider", "external_id");
