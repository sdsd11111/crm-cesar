CREATE TABLE "agent_briefings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"agent_id" uuid,
	"meeting_id" uuid,
	"summary" text,
	"strategy" text,
	"talking_points" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "agents" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"contact_id" uuid NOT NULL,
	"current_risk_score" integer DEFAULT 0,
	"reliability_stats" text DEFAULT '{"fulfilled": 0, "broken": 0, "pending": 0}',
	"config" text DEFAULT '{}',
	"special_instructions" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	"last_planned_at" timestamp,
	CONSTRAINT "agents_contact_id_unique" UNIQUE("contact_id")
);
--> statement-breakpoint
CREATE TABLE "call_analyses" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"contact_id" uuid,
	"lead_id" uuid,
	"discovery_lead_id" uuid,
	"audio_url" text,
	"transcription" text,
	"metrics" text,
	"feedback" text,
	"next_focus" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "commitments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"agent_id" uuid,
	"meeting_id" uuid,
	"title" text NOT NULL,
	"description" text,
	"actor_role" text,
	"assignee_user_id" text,
	"assignee_name" text,
	"due_date" timestamp with time zone,
	"grace_period_days" integer DEFAULT 0,
	"status" text DEFAULT 'draft',
	"severity" text DEFAULT 'medium',
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "contact_channels" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"contact_id" uuid NOT NULL,
	"platform" text NOT NULL,
	"identifier" text NOT NULL,
	"is_primary" boolean DEFAULT false,
	"verified" boolean DEFAULT false,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "contact_channels_platform_identifier_unique" UNIQUE("platform","identifier")
);
--> statement-breakpoint
CREATE TABLE "contacts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"entity_type" text DEFAULT 'prospect' NOT NULL,
	"business_name" text NOT NULL,
	"contact_name" text NOT NULL,
	"phone" text,
	"email" text,
	"city" text,
	"province" text,
	"address" text,
	"business_type" text,
	"connection_type" text,
	"business_activity" text,
	"interested_product" text,
	"verbal_agreements" text,
	"personality_type" text,
	"communication_style" text,
	"key_phrases" text,
	"strengths" text,
	"weaknesses" text,
	"opportunities" text,
	"threats" text,
	"relationship_type" text,
	"quantified_problem" text,
	"conservative_goal" text,
	"years_in_business" integer,
	"number_of_employees" integer,
	"number_of_branches" integer,
	"current_clients_per_month" integer,
	"average_ticket" integer,
	"known_competition" text,
	"high_season" text,
	"critical_dates" text,
	"facebook_followers" integer,
	"other_achievements" text,
	"specific_recognitions" text,
	"files" text DEFAULT '[]',
	"audio_transcriptions" text DEFAULT '[]',
	"quotation" text,
	"status" text DEFAULT 'sin_contacto',
	"phase" integer DEFAULT 1,
	"pains" text,
	"goals" text,
	"objections" text,
	"contract_value" double precision,
	"contract_start_date" timestamp,
	"outreach_status" text,
	"whatsapp_status" text,
	"whatsapp_sent_at" timestamp,
	"email_sequence_step" integer DEFAULT 0,
	"last_email_sent_at" timestamp,
	"next_follow_up" timestamp,
	"is_newsletter_subscriber" boolean DEFAULT false,
	"discovery_lead_id" uuid,
	"converted_to_lead_at" timestamp,
	"converted_to_client_at" timestamp,
	"birthday" timestamp,
	"anniversary_date" timestamp,
	"category_tags" text[] DEFAULT '{}',
	"whatsapp_opt_out" boolean DEFAULT false,
	"notes" text,
	"investigacion" text,
	"research_data" jsonb,
	"source" text DEFAULT 'recorridos',
	"client_id" uuid,
	"channel_source" text DEFAULT 'whatsapp',
	"bot_mode" text DEFAULT 'active',
	"last_activity_at" timestamp,
	"unread_count" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "contract_templates" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" text NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"fields" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"content_template" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "contract_templates_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "conversation_states" (
	"key" text PRIMARY KEY NOT NULL,
	"data" text DEFAULT '{}',
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "conversational_sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"contact_id" uuid,
	"chat_id" text NOT NULL,
	"status" text DEFAULT 'open' NOT NULL,
	"document_type" text NOT NULL,
	"collected_data" jsonb DEFAULT '{}'::jsonb,
	"last_generated_text" text,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "discovery_leads" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"ruc" text,
	"codigo_establecimiento_ruc" text,
	"estado_ruc" text,
	"nombre_comercial" text NOT NULL,
	"numero_registro" text,
	"fecha_registro" text,
	"actividad_modalidad" text,
	"clasificacion" text,
	"categoria" text,
	"razon_social_propietario" text,
	"representante_legal" text,
	"tipo_personeria_juridica" text,
	"personeria_juridica" text,
	"provincia" text,
	"canton" text,
	"parroquia" text,
	"tipo_parroquia" text,
	"direccion" text,
	"referencia_direccion" text,
	"latitud" text,
	"longitud" text,
	"zona_turistica" text,
	"administracion_zonal" text,
	"sector_turistico" text,
	"telefono_principal" text,
	"telefono_secundario" text,
	"correo_electronico" text,
	"direccion_web" text,
	"persona_contacto" text,
	"correo_persona_contacto" text,
	"tipo_local" text,
	"tipo_establecimiento" text,
	"nombre_franquicia_cadena" text,
	"estado_registro_establecimiento" text,
	"sistema_origen" text,
	"estado_registro_con_deuda" text,
	"total_trabajadores" integer,
	"total_trabajadores_hombres" integer,
	"total_trabajadores_mujeres" integer,
	"total_habitaciones_tiendas" integer,
	"total_camas" integer,
	"total_plazas" integer,
	"total_mesas" integer,
	"total_capacidades_personas" integer,
	"titulo_habilitante" text,
	"tipo_vehiculo" text,
	"matricula" text,
	"tipo_embarcaciones" text,
	"columna1" text DEFAULT 'no_contactado',
	"columna2" text DEFAULT 'pendiente',
	"research_data" text,
	"booking_info" text,
	"google_info" text,
	"investigacion" text,
	"status" text DEFAULT 'pending',
	"bot_mode" text DEFAULT 'active',
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "donna_chat_messages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"chat_id" text NOT NULL,
	"role" text NOT NULL,
	"content" text NOT NULL,
	"platform" text DEFAULT 'whatsapp',
	"message_timestamp" timestamp DEFAULT now() NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "leads_capturar_clientes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"full_name" text,
	"phone" text,
	"location" text,
	"referral_source" text,
	"birth_date" text,
	"suggestions" text,
	"current_step" integer DEFAULT 1,
	"status" text DEFAULT 'incomplete',
	"source" text DEFAULT 'pdf_qr_carnaval',
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "loyalty_missions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"source" text NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"planned_at" timestamp with time zone,
	"contact_id" uuid,
	"content" text NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "pending_messages_queue" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"chat_id" text NOT NULL,
	"content" text NOT NULL,
	"platform" text DEFAULT 'whatsapp',
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"received_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "personal_liabilities" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"category" text NOT NULL,
	"monthly_payment" double precision NOT NULL,
	"total_debt" double precision,
	"remaining_debt" double precision,
	"due_date" integer,
	"status" text DEFAULT 'UP_TO_DATE',
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "reminders" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"event_id" uuid,
	"task_id" uuid,
	"title" text NOT NULL,
	"message" text NOT NULL,
	"send_at" timestamp with time zone NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"channel" text DEFAULT 'telegram' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "system_settings" (
	"key" text PRIMARY KEY NOT NULL,
	"value" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "whatsapp_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"contact_id" uuid,
	"trigger" text NOT NULL,
	"content" text NOT NULL,
	"status" text DEFAULT 'processing' NOT NULL,
	"error_message" text,
	"approved_by" text,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "interactions" DROP CONSTRAINT "interactions_related_client_id_clients_id_fk";
--> statement-breakpoint
ALTER TABLE "interactions" DROP CONSTRAINT "interactions_related_lead_id_leads_id_fk";
--> statement-breakpoint
ALTER TABLE "clients" ADD COLUMN "address" text;--> statement-breakpoint
ALTER TABLE "clients" ADD COLUMN "business_activity" text;--> statement-breakpoint
ALTER TABLE "clients" ADD COLUMN "interested_product" text;--> statement-breakpoint
ALTER TABLE "clients" ADD COLUMN "verbal_agreements" text;--> statement-breakpoint
ALTER TABLE "clients" ADD COLUMN "personality_type" text;--> statement-breakpoint
ALTER TABLE "clients" ADD COLUMN "communication_style" text;--> statement-breakpoint
ALTER TABLE "clients" ADD COLUMN "key_phrases" text;--> statement-breakpoint
ALTER TABLE "clients" ADD COLUMN "pains" text;--> statement-breakpoint
ALTER TABLE "clients" ADD COLUMN "goals" text;--> statement-breakpoint
ALTER TABLE "clients" ADD COLUMN "objections" text;--> statement-breakpoint
ALTER TABLE "clients" ADD COLUMN "strengths" text;--> statement-breakpoint
ALTER TABLE "clients" ADD COLUMN "weaknesses" text;--> statement-breakpoint
ALTER TABLE "clients" ADD COLUMN "opportunities" text;--> statement-breakpoint
ALTER TABLE "clients" ADD COLUMN "threats" text;--> statement-breakpoint
ALTER TABLE "clients" ADD COLUMN "relationship_type" text;--> statement-breakpoint
ALTER TABLE "clients" ADD COLUMN "quantified_problem" text;--> statement-breakpoint
ALTER TABLE "clients" ADD COLUMN "conservative_goal" text;--> statement-breakpoint
ALTER TABLE "clients" ADD COLUMN "years_in_business" integer;--> statement-breakpoint
ALTER TABLE "clients" ADD COLUMN "number_of_employees" integer;--> statement-breakpoint
ALTER TABLE "clients" ADD COLUMN "number_of_branches" integer;--> statement-breakpoint
ALTER TABLE "clients" ADD COLUMN "current_clients_per_month" integer;--> statement-breakpoint
ALTER TABLE "clients" ADD COLUMN "average_ticket" integer;--> statement-breakpoint
ALTER TABLE "clients" ADD COLUMN "known_competition" text;--> statement-breakpoint
ALTER TABLE "clients" ADD COLUMN "high_season" text;--> statement-breakpoint
ALTER TABLE "clients" ADD COLUMN "critical_dates" text;--> statement-breakpoint
ALTER TABLE "clients" ADD COLUMN "facebook_followers" integer;--> statement-breakpoint
ALTER TABLE "clients" ADD COLUMN "other_achievements" text;--> statement-breakpoint
ALTER TABLE "clients" ADD COLUMN "specific_recognitions" text;--> statement-breakpoint
ALTER TABLE "clients" ADD COLUMN "discovery_lead_id" uuid;--> statement-breakpoint
ALTER TABLE "events" ADD COLUMN "status" text DEFAULT 'scheduled';--> statement-breakpoint
ALTER TABLE "events" ADD COLUMN "contact_id" uuid;--> statement-breakpoint
ALTER TABLE "interactions" ADD COLUMN "contact_id" uuid;--> statement-breakpoint
ALTER TABLE "interactions" ADD COLUMN "discovery_lead_id" uuid;--> statement-breakpoint
ALTER TABLE "interactions" ADD COLUMN "metadata" jsonb DEFAULT '{}'::jsonb;--> statement-breakpoint
ALTER TABLE "leads" ADD COLUMN "discovery_lead_id" uuid;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "Source_ID" integer;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "Nombre del Producto o Servicio" text NOT NULL;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "Precio" double precision;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "Descripción" text;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "Beneficios" text;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "Categoría para Blog" text;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "Categoría Interna / Subcategoría" text;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "Etiqueta" text;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "Forma de pago" text;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "Link Video" text;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "Servicios Incluidos (Ejemplo base)" text;--> statement-breakpoint
ALTER TABLE "tasks" ADD COLUMN "contact_id" uuid;--> statement-breakpoint
ALTER TABLE "tasks" ADD COLUMN "reminder_at" timestamp;--> statement-breakpoint
ALTER TABLE "tasks" ADD COLUMN "reminder_sent" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "transactions" ADD COLUMN "sub_type" text;--> statement-breakpoint
ALTER TABLE "transactions" ADD COLUMN "parent_transaction_id" uuid;--> statement-breakpoint
ALTER TABLE "agent_briefings" ADD CONSTRAINT "agent_briefings_agent_id_agents_id_fk" FOREIGN KEY ("agent_id") REFERENCES "public"."agents"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agent_briefings" ADD CONSTRAINT "agent_briefings_meeting_id_events_id_fk" FOREIGN KEY ("meeting_id") REFERENCES "public"."events"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agents" ADD CONSTRAINT "agents_contact_id_contacts_id_fk" FOREIGN KEY ("contact_id") REFERENCES "public"."contacts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "call_analyses" ADD CONSTRAINT "call_analyses_contact_id_contacts_id_fk" FOREIGN KEY ("contact_id") REFERENCES "public"."contacts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "call_analyses" ADD CONSTRAINT "call_analyses_lead_id_leads_id_fk" FOREIGN KEY ("lead_id") REFERENCES "public"."leads"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "call_analyses" ADD CONSTRAINT "call_analyses_discovery_lead_id_discovery_leads_id_fk" FOREIGN KEY ("discovery_lead_id") REFERENCES "public"."discovery_leads"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "commitments" ADD CONSTRAINT "commitments_agent_id_agents_id_fk" FOREIGN KEY ("agent_id") REFERENCES "public"."agents"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "commitments" ADD CONSTRAINT "commitments_meeting_id_events_id_fk" FOREIGN KEY ("meeting_id") REFERENCES "public"."events"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contact_channels" ADD CONSTRAINT "contact_channels_contact_id_contacts_id_fk" FOREIGN KEY ("contact_id") REFERENCES "public"."contacts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contacts" ADD CONSTRAINT "contacts_discovery_lead_id_discovery_leads_id_fk" FOREIGN KEY ("discovery_lead_id") REFERENCES "public"."discovery_leads"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contacts" ADD CONSTRAINT "contacts_client_id_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "conversational_sessions" ADD CONSTRAINT "conversational_sessions_contact_id_contacts_id_fk" FOREIGN KEY ("contact_id") REFERENCES "public"."contacts"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "loyalty_missions" ADD CONSTRAINT "loyalty_missions_contact_id_contacts_id_fk" FOREIGN KEY ("contact_id") REFERENCES "public"."contacts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reminders" ADD CONSTRAINT "reminders_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reminders" ADD CONSTRAINT "reminders_task_id_tasks_id_fk" FOREIGN KEY ("task_id") REFERENCES "public"."tasks"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "whatsapp_logs" ADD CONSTRAINT "whatsapp_logs_contact_id_contacts_id_fk" FOREIGN KEY ("contact_id") REFERENCES "public"."contacts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "contact_channels_identifier_idx" ON "contact_channels" USING btree ("identifier");--> statement-breakpoint
CREATE INDEX "conversational_sessions_chat_id_idx" ON "conversational_sessions" USING btree ("chat_id");--> statement-breakpoint
CREATE INDEX "conversational_sessions_status_idx" ON "conversational_sessions" USING btree ("status");--> statement-breakpoint
CREATE INDEX "donna_chat_messages_chat_id_idx" ON "donna_chat_messages" USING btree ("chat_id");--> statement-breakpoint
CREATE INDEX "donna_chat_messages_timestamp_idx" ON "donna_chat_messages" USING btree ("message_timestamp");--> statement-breakpoint
ALTER TABLE "clients" ADD CONSTRAINT "clients_discovery_lead_id_discovery_leads_id_fk" FOREIGN KEY ("discovery_lead_id") REFERENCES "public"."discovery_leads"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "events" ADD CONSTRAINT "events_contact_id_contacts_id_fk" FOREIGN KEY ("contact_id") REFERENCES "public"."contacts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "interactions" ADD CONSTRAINT "interactions_contact_id_contacts_id_fk" FOREIGN KEY ("contact_id") REFERENCES "public"."contacts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "interactions" ADD CONSTRAINT "interactions_discovery_lead_id_discovery_leads_id_fk" FOREIGN KEY ("discovery_lead_id") REFERENCES "public"."discovery_leads"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "leads" ADD CONSTRAINT "leads_discovery_lead_id_discovery_leads_id_fk" FOREIGN KEY ("discovery_lead_id") REFERENCES "public"."discovery_leads"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_contact_id_contacts_id_fk" FOREIGN KEY ("contact_id") REFERENCES "public"."contacts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "interactions_contact_id_idx" ON "interactions" USING btree ("contact_id");--> statement-breakpoint
CREATE INDEX "interactions_performed_at_idx" ON "interactions" USING btree ("performed_at");--> statement-breakpoint
ALTER TABLE "interactions" DROP COLUMN "related_client_id";--> statement-breakpoint
ALTER TABLE "interactions" DROP COLUMN "related_lead_id";--> statement-breakpoint
ALTER TABLE "products" DROP COLUMN "source_id";--> statement-breakpoint
ALTER TABLE "products" DROP COLUMN "name";--> statement-breakpoint
ALTER TABLE "products" DROP COLUMN "price";--> statement-breakpoint
ALTER TABLE "products" DROP COLUMN "description";--> statement-breakpoint
ALTER TABLE "products" DROP COLUMN "benefits";--> statement-breakpoint
ALTER TABLE "products" DROP COLUMN "category";--> statement-breakpoint
ALTER TABLE "products" DROP COLUMN "sub_category";--> statement-breakpoint
ALTER TABLE "products" DROP COLUMN "tags";--> statement-breakpoint
ALTER TABLE "products" DROP COLUMN "payment_form";--> statement-breakpoint
ALTER TABLE "products" DROP COLUMN "video_url";--> statement-breakpoint
ALTER TABLE "products" DROP COLUMN "services_included";