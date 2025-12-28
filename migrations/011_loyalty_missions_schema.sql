-- Migration: Loyalty Missions & Agent Memory
-- Description: Adds table for programmed loyalty missions and expands agents for experiential memory.

-- 1. Create table for loyalty missions
CREATE TABLE IF NOT EXISTS loyalty_missions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    source TEXT NOT NULL CHECK (source IN ('micro', 'macro')),
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'scheduled', 'executed', 'cancelled')),
    planned_at TIMESTAMPTZ,
    contact_id UUID REFERENCES contacts(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Add memory fields to agents table
ALTER TABLE agents 
ADD COLUMN IF NOT EXISTS experiential_memory JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS emotional_profile JSONB DEFAULT '{}';

-- 3. Add index for missions scheduling
CREATE INDEX IF NOT EXISTS idx_loyalty_missions_status_planned ON loyalty_missions(status, planned_at);
