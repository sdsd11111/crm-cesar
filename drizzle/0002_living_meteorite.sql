CREATE TABLE "donna_instructions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"category" text NOT NULL,
	"instruction" text NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "donna_session_telemetry" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"session_id" uuid NOT NULL,
	"initial_request" text NOT NULL,
	"final_document_text" text,
	"iteration_count" integer DEFAULT 0 NOT NULL,
	"was_successful" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "donna_session_telemetry" ADD CONSTRAINT "donna_session_telemetry_session_id_conversational_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."conversational_sessions"("id") ON DELETE cascade ON UPDATE no action;