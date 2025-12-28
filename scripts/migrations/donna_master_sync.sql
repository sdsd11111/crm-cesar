-- ========================================================
-- DONNA MASTER INFRASTRUCTURE SYNC
-- Run this in your Supabase SQL Editor to enable all features.
-- ========================================================

-- 1. Ensure columns exist in 'contacts'
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS birthday TIMESTAMP WITH TIME ZONE;
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS anniversary_date TIMESTAMP WITH TIME ZONE;
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS category_tags TEXT[] DEFAULT '{}';
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS whatsapp_opt_out BOOLEAN DEFAULT false;

-- 2. Agents Table sync (Donna's Micro Profile)
CREATE TABLE IF NOT EXISTS agents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    contact_id UUID NOT NULL UNIQUE REFERENCES contacts(id) ON DELETE CASCADE,
    current_risk_score INTEGER DEFAULT 0,
    reliability_stats TEXT DEFAULT '{"fulfilled": 0, "broken": 0, "pending": 0}',
    config TEXT DEFAULT '{}',
    special_instructions TEXT,
    last_planned_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Ensure columns exist if table was already there
ALTER TABLE agents ADD COLUMN IF NOT EXISTS last_planned_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE agents ADD COLUMN IF NOT EXISTS current_risk_score INTEGER DEFAULT 0;
ALTER TABLE agents ADD COLUMN IF NOT EXISTS reliability_stats TEXT DEFAULT '{"fulfilled": 0, "broken": 0, "pending": 0}';
ALTER TABLE agents ADD COLUMN IF NOT EXISTS config TEXT DEFAULT '{}';

-- 3. Create 'loyalty_missions' table (Donna's Action Suggestions)
CREATE TABLE IF NOT EXISTS loyalty_missions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    source TEXT NOT NULL, -- 'micro' or 'macro'
    status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'approved', 'executed', 'suggested_rejected'
    planned_at TIMESTAMP WITH TIME ZONE,
    contact_id UUID REFERENCES contacts(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Create 'whatsapp_logs' (Security & Anti-Ban)
CREATE TABLE IF NOT EXISTS whatsapp_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    contact_id UUID REFERENCES contacts(id) ON DELETE CASCADE,
    trigger TEXT NOT NULL, -- 'donna', 'finance', 'manual', 'test'
    content TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'processing',
    error_message TEXT,
    approved_by TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Create 'reminders' (Internal Telegram Alerts)
CREATE TABLE IF NOT EXISTS reminders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID REFERENCES events(id) ON DELETE CASCADE,
    task_id UUID REFERENCES tasks(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    send_at TIMESTAMP WITH TIME ZONE NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending',
    channel TEXT NOT NULL DEFAULT 'telegram',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. Refresh PostgREST Cache
NOTIFY pgrst, 'reload schema';

-- 7. SECURITY HARDENING: Enable RLS
ALTER TABLE IF EXISTS agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS loyalty_missions ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS whatsapp_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS reminders ENABLE ROW LEVEL SECURITY;

-- 8. Enable full access for Authenticated users (CRM standard)
DROP POLICY IF EXISTS "Full access for authenticated users" ON agents;
CREATE POLICY "Full access for authenticated users" ON agents FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Full access for authenticated users" ON loyalty_missions;
CREATE POLICY "Full access for authenticated users" ON loyalty_missions FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Full access for authenticated users" ON whatsapp_logs;
CREATE POLICY "Full access for authenticated users" ON whatsapp_logs FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Full access for authenticated users" ON reminders;
CREATE POLICY "Full access for authenticated users" ON reminders FOR ALL TO authenticated USING (true) WITH CHECK (true);
