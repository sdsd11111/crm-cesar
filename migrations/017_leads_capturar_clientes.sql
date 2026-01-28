-- Migration: 017_leads_capturar_clientes
-- Description: Table for capturing leads from the PDF QR multi-step form

CREATE TABLE IF NOT EXISTS leads_capturar_clientes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    full_name TEXT,
    phone TEXT, -- New field
    location TEXT,
    referral_source TEXT, -- New field
    birth_date DATE,
    suggestions TEXT,
    current_step INTEGER DEFAULT 1,
    status TEXT DEFAULT 'incomplete' CHECK (status IN ('incomplete', 'completed')),
    
    -- Metadata if needed
    source TEXT DEFAULT 'pdf_qr_carnaval',
    metadata JSONB DEFAULT '{}'::jsonb,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Enable RLS
ALTER TABLE leads_capturar_clientes ENABLE ROW LEVEL SECURITY;

-- Policy for inserting (Public access for the form)
CREATE POLICY "Enable insert for all" ON leads_capturar_clientes
    FOR INSERT WITH CHECK (true);

-- Policy for viewing (Only authenticated users)
CREATE POLICY "Enable select for authenticated users only" ON leads_capturar_clientes
    FOR SELECT USING (auth.role() = 'authenticated');

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_leads_capturar_clientes_updated_at
    BEFORE UPDATE ON leads_capturar_clientes
    FOR EACH ROW
    EXECUTE PROCEDURE update_updated_at_column();
