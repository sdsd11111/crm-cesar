
-- REPAIR MIGRATION: Ensure ALL schema columns exist in 'contacts'
DO $$ 
BEGIN
    -- Basic info
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='contacts' AND column_name='business_name') THEN ALTER TABLE "contacts" ADD COLUMN "business_name" text; END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='contacts' AND column_name='contact_name') THEN ALTER TABLE "contacts" ADD COLUMN "contact_name" text; END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='contacts' AND column_name='phone') THEN ALTER TABLE "contacts" ADD COLUMN "phone" text; END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='contacts' AND column_name='email') THEN ALTER TABLE "contacts" ADD COLUMN "email" text; END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='contacts' AND column_name='city') THEN ALTER TABLE "contacts" ADD COLUMN "city" text; END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='contacts' AND column_name='province') THEN ALTER TABLE "contacts" ADD COLUMN "province" text; END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='contacts' AND column_name='address') THEN ALTER TABLE "contacts" ADD COLUMN "address" text; END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='contacts' AND column_name='business_type') THEN ALTER TABLE "contacts" ADD COLUMN "business_type" text; END IF;
    
    -- Recorridos fields
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='contacts' AND column_name='connection_type') THEN ALTER TABLE "contacts" ADD COLUMN "connection_type" text; END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='contacts' AND column_name='business_activity') THEN ALTER TABLE "contacts" ADD COLUMN "business_activity" text; END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='contacts' AND column_name='interested_product') THEN ALTER TABLE "contacts" ADD COLUMN "interested_product" text; END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='contacts' AND column_name='verbal_agreements') THEN ALTER TABLE "contacts" ADD COLUMN "verbal_agreements" text; END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='contacts' AND column_name='personality_type') THEN ALTER TABLE "contacts" ADD COLUMN "personality_type" text; END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='contacts' AND column_name='communication_style') THEN ALTER TABLE "contacts" ADD COLUMN "communication_style" text; END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='contacts' AND column_name='key_phrases') THEN ALTER TABLE "contacts" ADD COLUMN "key_phrases" text; END IF;

    -- SWOT / FOMO
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='contacts' AND column_name='strengths') THEN ALTER TABLE "contacts" ADD COLUMN "strengths" text; END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='contacts' AND column_name='weaknesses') THEN ALTER TABLE "contacts" ADD COLUMN "weaknesses" text; END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='contacts' AND column_name='opportunities') THEN ALTER TABLE "contacts" ADD COLUMN "opportunities" text; END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='contacts' AND column_name='threats') THEN ALTER TABLE "contacts" ADD COLUMN "threats" text; END IF;

    -- Business Metrics
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='contacts' AND column_name='relationship_type') THEN ALTER TABLE "contacts" ADD COLUMN "relationship_type" text; END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='contacts' AND column_name='quantified_problem') THEN ALTER TABLE "contacts" ADD COLUMN "quantified_problem" text; END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='contacts' AND column_name='conservative_goal') THEN ALTER TABLE "contacts" ADD COLUMN "conservative_goal" text; END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='contacts' AND column_name='years_in_business') THEN ALTER TABLE "contacts" ADD COLUMN "years_in_business" integer; END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='contacts' AND column_name='number_of_employees') THEN ALTER TABLE "contacts" ADD COLUMN "number_of_employees" integer; END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='contacts' AND column_name='number_of_branches') THEN ALTER TABLE "contacts" ADD COLUMN "number_of_branches" integer; END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='contacts' AND column_name='current_clients_per_month') THEN ALTER TABLE "contacts" ADD COLUMN "current_clients_per_month" integer; END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='contacts' AND column_name='average_ticket') THEN ALTER TABLE "contacts" ADD COLUMN "average_ticket" integer; END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='contacts' AND column_name='known_competition') THEN ALTER TABLE "contacts" ADD COLUMN "known_competition" text; END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='contacts' AND column_name='high_season') THEN ALTER TABLE "contacts" ADD COLUMN "high_season" text; END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='contacts' AND column_name='critical_dates') THEN ALTER TABLE "contacts" ADD COLUMN "critical_dates" text; END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='contacts' AND column_name='facebook_followers') THEN ALTER TABLE "contacts" ADD COLUMN "facebook_followers" integer; END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='contacts' AND column_name='other_achievements') THEN ALTER TABLE "contacts" ADD COLUMN "other_achievements" text; END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='contacts' AND column_name='specific_recognitions') THEN ALTER TABLE "contacts" ADD COLUMN "specific_recognitions" text; END IF;

    -- Files & Status
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='contacts' AND column_name='files') THEN ALTER TABLE "contacts" ADD COLUMN "files" text DEFAULT '[]'; END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='contacts' AND column_name='audio_transcriptions') THEN ALTER TABLE "contacts" ADD COLUMN "audio_transcriptions" text DEFAULT '[]'; END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='contacts' AND column_name='quotation') THEN ALTER TABLE "contacts" ADD COLUMN "quotation" text; END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='contacts' AND column_name='status') THEN ALTER TABLE "contacts" ADD COLUMN "status" text DEFAULT 'sin_contacto'; END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='contacts' AND column_name='phase') THEN ALTER TABLE "contacts" ADD COLUMN "phase" integer DEFAULT 1; END IF;

    -- Prospecting & CRM
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='contacts' AND column_name='pains') THEN ALTER TABLE "contacts" ADD COLUMN "pains" text; END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='contacts' AND column_name='goals') THEN ALTER TABLE "contacts" ADD COLUMN "goals" text; END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='contacts' AND column_name='objections') THEN ALTER TABLE "contacts" ADD COLUMN "objections" text; END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='contacts' AND column_name='contract_value') THEN ALTER TABLE "contacts" ADD COLUMN "contract_value" double precision; END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='contacts' AND column_name='contract_start_date') THEN ALTER TABLE "contacts" ADD COLUMN "contract_start_date" timestamp; END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='contacts' AND column_name='outreach_status') THEN ALTER TABLE "contacts" ADD COLUMN "outreach_status" text; END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='contacts' AND column_name='whatsapp_status') THEN ALTER TABLE "contacts" ADD COLUMN "whatsapp_status" text; END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='contacts' AND column_name='whatsapp_sent_at') THEN ALTER TABLE "contacts" ADD COLUMN "whatsapp_sent_at" timestamp; END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='contacts' AND column_name='email_sequence_step') THEN ALTER TABLE "contacts" ADD COLUMN "email_sequence_step" integer DEFAULT 0; END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='contacts' AND column_name='last_email_sent_at') THEN ALTER TABLE "contacts" ADD COLUMN "last_email_sent_at" timestamp; END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='contacts' AND column_name='next_follow_up') THEN ALTER TABLE "contacts" ADD COLUMN "next_follow_up" timestamp; END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='contacts' AND column_name='is_newsletter_subscriber') THEN ALTER TABLE "contacts" ADD COLUMN "is_newsletter_subscriber" boolean DEFAULT false; END IF;

    -- Identity & Lifecycle
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='contacts' AND column_name='discovery_lead_id') THEN ALTER TABLE "contacts" ADD COLUMN "discovery_lead_id" uuid; END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='contacts' AND column_name='converted_to_lead_at') THEN ALTER TABLE "contacts" ADD COLUMN "converted_to_lead_at" timestamp; END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='contacts' AND column_name='converted_to_client_at') THEN ALTER TABLE "contacts" ADD COLUMN "converted_to_client_at" timestamp; END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='contacts' AND column_name='birthday') THEN ALTER TABLE "contacts" ADD COLUMN "birthday" timestamp; END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='contacts' AND column_name='anniversary_date') THEN ALTER TABLE "contacts" ADD COLUMN "anniversary_date" timestamp; END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='contacts' AND column_name='category_tags') THEN ALTER TABLE "contacts" ADD COLUMN "category_tags" text[] DEFAULT '{}'; END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='contacts' AND column_name='whatsapp_opt_out') THEN ALTER TABLE "contacts" ADD COLUMN "whatsapp_opt_out" boolean DEFAULT false; END IF;

    -- Metadata & Omnichannel
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='contacts' AND column_name='notes') THEN ALTER TABLE "contacts" ADD COLUMN "notes" text; END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='contacts' AND column_name='investigacion') THEN ALTER TABLE "contacts" ADD COLUMN "investigacion" text; END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='contacts' AND column_name='research_data') THEN ALTER TABLE "contacts" ADD COLUMN "research_data" jsonb; END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='contacts' AND column_name='source') THEN ALTER TABLE "contacts" ADD COLUMN "source" text DEFAULT 'recorridos'; END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='contacts' AND column_name='client_id') THEN ALTER TABLE "contacts" ADD COLUMN "client_id" uuid; END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='contacts' AND column_name='channel_source') THEN ALTER TABLE "contacts" ADD COLUMN "channel_source" text DEFAULT 'whatsapp'; END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='contacts' AND column_name='last_activity_at') THEN ALTER TABLE "contacts" ADD COLUMN "last_activity_at" timestamp; END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='contacts' AND column_name='unread_count') THEN ALTER TABLE "contacts" ADD COLUMN "unread_count" integer DEFAULT 0; END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='contacts' AND column_name='created_at') THEN ALTER TABLE "contacts" ADD COLUMN "created_at" timestamp DEFAULT now(); END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='contacts' AND column_name='updated_at') THEN ALTER TABLE "contacts" ADD COLUMN "updated_at" timestamp DEFAULT now(); END IF;

END $$;
