-- =============================================================================
-- MIGRATION 021: Donna Instructions & Session Telemetry Tables
-- Fixes production error: "column category does not exist" / "instruction does not exist"
-- =============================================================================

-- ⚠️ PHASE 10 FIX: Drop broken/legacy versions of these tables to ensure clean state
DROP TABLE IF EXISTS donna_session_telemetry;
DROP TABLE IF EXISTS donna_instructions;

-- DONNA BRAINS: INSTRUCTIONAL RAG (Long-term Knowledge Base)
CREATE TABLE donna_instructions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category TEXT NOT NULL CHECK (category IN ('commercial', 'personality', 'formatting', 'product_mapping')),
  instruction TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- DONNA BRAINS: SESSION TELEMETRY (For Learning Extraction)
CREATE TABLE donna_session_telemetry (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES conversational_sessions(id) ON DELETE CASCADE NOT NULL,
  initial_request TEXT NOT NULL,
  final_document_text TEXT,
  iteration_count INTEGER NOT NULL DEFAULT 0,
  was_successful BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Seed a basic instruction so the table is not empty
INSERT INTO donna_instructions (category, instruction) VALUES
  ('commercial', 'El nombre del consultor es Ing. César Reyes Jaramillo. Úsalo siempre en la firma de documentos.')
ON CONFLICT DO NOTHING;
