-- Migration SQL for conversational_sessions, donna_instructions, and donna_session_telemetry

CREATE TABLE IF NOT EXISTS "conversational_sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"contact_id" uuid,
	"chat_id" varchar NOT NULL,
	"status" varchar DEFAULT 'open' NOT NULL,
	"document_type" varchar NOT NULL,
	"collected_data" jsonb DEFAULT '{}'::jsonb,
	"last_generated_text" text,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "donna_instructions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"instruction_text" text NOT NULL,
	"context_tags" text[],
	"is_active" boolean DEFAULT true,
	"priority" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "donna_session_telemetry" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"session_id" uuid,
	"intent_flow" varchar NOT NULL,
	"clarifications_needed" integer DEFAULT 0,
	"success_score" integer,
	"raw_log" jsonb,
	"created_at" timestamp DEFAULT now()
);

DO $$ BEGIN
 ALTER TABLE "conversational_sessions" ADD CONSTRAINT "conversational_sessions_contact_id_contacts_id_fk" FOREIGN KEY ("contact_id") REFERENCES "public"."contacts"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "donna_session_telemetry" ADD CONSTRAINT "donna_session_telemetry_session_id_conversational_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."conversational_sessions"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

CREATE INDEX IF NOT EXISTS "session_chat_idx" ON "conversational_sessions" USING btree ("chat_id");
CREATE INDEX IF NOT EXISTS "session_status_idx" ON "conversational_sessions" USING btree ("status");
