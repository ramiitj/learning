import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_lessons_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__lessons_v_version_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum_detours_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__detours_v_version_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum_glossary_locale" AS ENUM('en', 'hi', 'te');
  CREATE TYPE "public"."enum_glossary_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__glossary_v_version_locale" AS ENUM('en', 'hi', 'te');
  CREATE TYPE "public"."enum__glossary_v_version_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum_analogies_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__analogies_v_version_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum_teacher_guides_locale" AS ENUM('en', 'hi', 'te');
  CREATE TYPE "public"."enum_teacher_guides_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__teacher_guides_v_version_locale" AS ENUM('en', 'hi', 'te');
  CREATE TYPE "public"."enum__teacher_guides_v_version_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum_media_licence" AS ENUM('own-work', 'cc-by', 'cc-by-sa', 'cc0', 'licensed', 'public-domain');
  CREATE TYPE "public"."enum_media_review_status" AS ENUM('unreviewed', 'approved', 'rejected');
  CREATE TYPE "public"."enum_decisions_kind" AS ENUM('publish', 'conflict', 'new-component', 'new-agent', 'permission-change', 'amendment', 'schema-change', 'learner-data', 'budget', 'other');
  CREATE TYPE "public"."enum_decisions_status" AS ENUM('open', 'approved', 'rejected', 'withdrawn');
  CREATE TYPE "public"."enum_pipeline_runs_stage" AS ENUM('plan', 'draft', 'enrich', 'localise', 'review', 'revise', 'validate', 'teacher-guide', 'creator-preview', 'done', 'paused', 'failed');
  CREATE TYPE "public"."enum_pipeline_runs_status" AS ENUM('queued', 'running', 'waiting-for-creator', 'done', 'failed', 'paused');
  CREATE TYPE "public"."enum_events_actor_kind" AS ENUM('creator', 'agent', 'system', 'public', 'reviewer');
  CREATE TYPE "public"."enum_feedback_role" AS ENUM('learner', 'teacher', 'other');
  CREATE TYPE "public"."enum_feedback_status" AS ENUM('new', 'triaged', 'fixed', 'wont-fix');
  CREATE TYPE "public"."enum_users_role" AS ENUM('creator', 'agent', 'reviewer');
  CREATE TYPE "public"."enum_oauth_grants_kind" AS ENUM('refresh-token', 'used-code');
  CREATE TABLE "lessons" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"lesson_id" varchar,
  	"title" varchar,
  	"doc" jsonb,
  	"validation" jsonb,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"_status" "enum_lessons_status" DEFAULT 'draft'
  );
  
  CREATE TABLE "_lessons_v" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"parent_id" integer,
  	"version_lesson_id" varchar,
  	"version_title" varchar,
  	"version_doc" jsonb,
  	"version_validation" jsonb,
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"version__status" "enum__lessons_v_version_status" DEFAULT 'draft',
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"latest" boolean
  );
  
  CREATE TABLE "detours" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"detour_id" varchar,
  	"doc" jsonb,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"_status" "enum_detours_status" DEFAULT 'draft'
  );
  
  CREATE TABLE "_detours_v" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"parent_id" integer,
  	"version_detour_id" varchar,
  	"version_doc" jsonb,
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"version__status" "enum__detours_v_version_status" DEFAULT 'draft',
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"latest" boolean
  );
  
  CREATE TABLE "glossary" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"term_id" varchar,
  	"locale" "enum_glossary_locale",
  	"term" varchar,
  	"definition" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"_status" "enum_glossary_status" DEFAULT 'draft'
  );
  
  CREATE TABLE "_glossary_v" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"parent_id" integer,
  	"version_term_id" varchar,
  	"version_locale" "enum__glossary_v_version_locale",
  	"version_term" varchar,
  	"version_definition" varchar,
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"version__status" "enum__glossary_v_version_status" DEFAULT 'draft',
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"latest" boolean
  );
  
  CREATE TABLE "analogies" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"concept" varchar,
  	"source" varchar,
  	"mappings" jsonb,
  	"break_point" varchar,
  	"fading" jsonb,
  	"locale_variants" jsonb,
  	"subjects" jsonb,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"_status" "enum_analogies_status" DEFAULT 'draft'
  );
  
  CREATE TABLE "_analogies_v" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"parent_id" integer,
  	"version_concept" varchar,
  	"version_source" varchar,
  	"version_mappings" jsonb,
  	"version_break_point" varchar,
  	"version_fading" jsonb,
  	"version_locale_variants" jsonb,
  	"version_subjects" jsonb,
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"version__status" "enum__analogies_v_version_status" DEFAULT 'draft',
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"latest" boolean
  );
  
  CREATE TABLE "concepts" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"concept_id" varchar NOT NULL,
  	"name" varchar NOT NULL,
  	"subject" varchar DEFAULT 'ai' NOT NULL,
  	"description" varchar,
  	"lessons" jsonb,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "concepts_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"concepts_id" integer
  );
  
  CREATE TABLE "teacher_guides" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"lesson_id" varchar,
  	"locale" "enum_teacher_guides_locale",
  	"guide" jsonb,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"_status" "enum_teacher_guides_status" DEFAULT 'draft'
  );
  
  CREATE TABLE "_teacher_guides_v" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"parent_id" integer,
  	"version_lesson_id" varchar,
  	"version_locale" "enum__teacher_guides_v_version_locale",
  	"version_guide" jsonb,
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"version__status" "enum__teacher_guides_v_version_status" DEFAULT 'draft',
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"latest" boolean
  );
  
  CREATE TABLE "media" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"alt" jsonb NOT NULL,
  	"captions" jsonb,
  	"transcripts" jsonb,
  	"provenance" varchar NOT NULL,
  	"licence" "enum_media_licence" NOT NULL,
  	"review_status" "enum_media_review_status" DEFAULT 'unreviewed',
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"url" varchar,
  	"thumbnail_u_r_l" varchar,
  	"filename" varchar,
  	"mime_type" varchar,
  	"filesize" numeric,
  	"width" numeric,
  	"height" numeric,
  	"focal_x" numeric,
  	"focal_y" numeric,
  	"sizes_small_url" varchar,
  	"sizes_small_width" numeric,
  	"sizes_small_height" numeric,
  	"sizes_small_mime_type" varchar,
  	"sizes_small_filesize" numeric,
  	"sizes_small_filename" varchar,
  	"sizes_medium_url" varchar,
  	"sizes_medium_width" numeric,
  	"sizes_medium_height" numeric,
  	"sizes_medium_mime_type" varchar,
  	"sizes_medium_filesize" numeric,
  	"sizes_medium_filename" varchar
  );
  
  CREATE TABLE "audiences" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"audience_id" varchar NOT NULL,
  	"label" varchar NOT NULL,
  	"profile" jsonb NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "decisions" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"title" varchar NOT NULL,
  	"kind" "enum_decisions_kind" NOT NULL,
  	"status" "enum_decisions_status" DEFAULT 'open' NOT NULL,
  	"summary" varchar NOT NULL,
  	"positions" jsonb,
  	"options" jsonb,
  	"target" varchar,
  	"requested_by" varchar,
  	"dissent" varchar,
  	"dissent_acknowledged" boolean,
  	"decision_reason" varchar,
  	"decided_at" timestamp(3) with time zone,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "pipeline_runs" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"title" varchar NOT NULL,
  	"request" varchar NOT NULL,
  	"lesson_id" integer,
  	"stage" "enum_pipeline_runs_stage" DEFAULT 'plan' NOT NULL,
  	"current_agent" varchar,
  	"status" "enum_pipeline_runs_status" DEFAULT 'queued' NOT NULL,
  	"cost_usd" numeric DEFAULT 0,
  	"usage" jsonb,
  	"steps" jsonb,
  	"flags" jsonb,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "events" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"actor_kind" "enum_events_actor_kind" NOT NULL,
  	"actor_id" varchar NOT NULL,
  	"action" varchar NOT NULL,
  	"target" varchar,
  	"reason" varchar,
  	"data" jsonb,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "feedback" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"summary" varchar,
  	"message" varchar NOT NULL,
  	"lesson_id" varchar,
  	"locale" varchar,
  	"role" "enum_feedback_role",
  	"status" "enum_feedback_status" DEFAULT 'new',
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "agents" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"agent_id" varchar NOT NULL,
  	"enabled" boolean DEFAULT true,
  	"tier" varchar,
  	"benchmark" jsonb,
  	"cost_usd" numeric DEFAULT 0,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "classroom_sessions" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"code" varchar NOT NULL,
  	"lesson_id" varchar NOT NULL,
  	"locale" varchar NOT NULL,
  	"host_key_hash" varchar NOT NULL,
  	"block_id" varchar,
  	"item_id" varchar,
  	"revision" numeric DEFAULT 0 NOT NULL,
  	"voting_open" boolean DEFAULT false,
  	"hands" jsonb,
  	"ended_at" timestamp(3) with time zone,
  	"expires_at" timestamp(3) with time zone NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "classroom_votes" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"session_id" integer NOT NULL,
  	"block_id" varchar NOT NULL,
  	"item_id" varchar DEFAULT '',
  	"choice" varchar NOT NULL,
  	"participant" varchar NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "users_passkeys" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"credential_id" varchar NOT NULL,
  	"public_key" varchar NOT NULL,
  	"counter" numeric NOT NULL,
  	"transports" jsonb,
  	"label" varchar
  );
  
  CREATE TABLE "users" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar NOT NULL,
  	"email" varchar,
  	"role" "enum_users_role" DEFAULT 'agent' NOT NULL,
  	"agent_id" varchar,
  	"reviewer_locales" jsonb,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "oauth_grants" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"kind" "enum_oauth_grants_kind" NOT NULL,
  	"client_name" varchar,
  	"client_id" varchar,
  	"token_hash" varchar NOT NULL,
  	"user_id" varchar,
  	"expires_at" timestamp(3) with time zone NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "payload_kv" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"key" varchar NOT NULL,
  	"data" jsonb NOT NULL
  );
  
  CREATE TABLE "payload_locked_documents" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"global_slug" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "payload_locked_documents_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"lessons_id" integer,
  	"detours_id" integer,
  	"glossary_id" integer,
  	"analogies_id" integer,
  	"concepts_id" integer,
  	"teacher_guides_id" integer,
  	"media_id" integer,
  	"audiences_id" integer,
  	"decisions_id" integer,
  	"pipeline_runs_id" integer,
  	"events_id" integer,
  	"feedback_id" integer,
  	"agents_id" integer,
  	"classroom_sessions_id" integer,
  	"classroom_votes_id" integer,
  	"users_id" integer,
  	"oauth_grants_id" integer
  );
  
  CREATE TABLE "payload_preferences" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"key" varchar,
  	"value" jsonb,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "payload_preferences_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"users_id" integer
  );
  
  CREATE TABLE "payload_migrations" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar,
  	"batch" numeric,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "constitution" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"text" varchar NOT NULL,
  	"amendment_reason" varchar NOT NULL,
  	"updated_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone
  );
  
  CREATE TABLE "_constitution_v" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"version_text" varchar NOT NULL,
  	"version_amendment_reason" varchar NOT NULL,
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "autonomy" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"settings" jsonb NOT NULL,
  	"updated_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone
  );
  
  CREATE TABLE "_autonomy_v" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"version_settings" jsonb NOT NULL,
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "budget" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"monthly_limit_usd" numeric DEFAULT 200 NOT NULL,
  	"alert_at" numeric DEFAULT 0.8 NOT NULL,
  	"updated_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone
  );
  
  ALTER TABLE "_lessons_v" ADD CONSTRAINT "_lessons_v_parent_id_lessons_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."lessons"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_detours_v" ADD CONSTRAINT "_detours_v_parent_id_detours_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."detours"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_glossary_v" ADD CONSTRAINT "_glossary_v_parent_id_glossary_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."glossary"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_analogies_v" ADD CONSTRAINT "_analogies_v_parent_id_analogies_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."analogies"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "concepts_rels" ADD CONSTRAINT "concepts_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."concepts"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "concepts_rels" ADD CONSTRAINT "concepts_rels_concepts_fk" FOREIGN KEY ("concepts_id") REFERENCES "public"."concepts"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_teacher_guides_v" ADD CONSTRAINT "_teacher_guides_v_parent_id_teacher_guides_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."teacher_guides"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "pipeline_runs" ADD CONSTRAINT "pipeline_runs_lesson_id_lessons_id_fk" FOREIGN KEY ("lesson_id") REFERENCES "public"."lessons"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "classroom_votes" ADD CONSTRAINT "classroom_votes_session_id_classroom_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."classroom_sessions"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "users_passkeys" ADD CONSTRAINT "users_passkeys_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."payload_locked_documents"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_lessons_fk" FOREIGN KEY ("lessons_id") REFERENCES "public"."lessons"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_detours_fk" FOREIGN KEY ("detours_id") REFERENCES "public"."detours"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_glossary_fk" FOREIGN KEY ("glossary_id") REFERENCES "public"."glossary"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_analogies_fk" FOREIGN KEY ("analogies_id") REFERENCES "public"."analogies"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_concepts_fk" FOREIGN KEY ("concepts_id") REFERENCES "public"."concepts"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_teacher_guides_fk" FOREIGN KEY ("teacher_guides_id") REFERENCES "public"."teacher_guides"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_media_fk" FOREIGN KEY ("media_id") REFERENCES "public"."media"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_audiences_fk" FOREIGN KEY ("audiences_id") REFERENCES "public"."audiences"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_decisions_fk" FOREIGN KEY ("decisions_id") REFERENCES "public"."decisions"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_pipeline_runs_fk" FOREIGN KEY ("pipeline_runs_id") REFERENCES "public"."pipeline_runs"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_events_fk" FOREIGN KEY ("events_id") REFERENCES "public"."events"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_feedback_fk" FOREIGN KEY ("feedback_id") REFERENCES "public"."feedback"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_agents_fk" FOREIGN KEY ("agents_id") REFERENCES "public"."agents"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_classroom_sessions_fk" FOREIGN KEY ("classroom_sessions_id") REFERENCES "public"."classroom_sessions"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_classroom_votes_fk" FOREIGN KEY ("classroom_votes_id") REFERENCES "public"."classroom_votes"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_users_fk" FOREIGN KEY ("users_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_oauth_grants_fk" FOREIGN KEY ("oauth_grants_id") REFERENCES "public"."oauth_grants"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_preferences_rels" ADD CONSTRAINT "payload_preferences_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."payload_preferences"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_preferences_rels" ADD CONSTRAINT "payload_preferences_rels_users_fk" FOREIGN KEY ("users_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
  CREATE UNIQUE INDEX "lessons_lesson_id_idx" ON "lessons" USING btree ("lesson_id");
  CREATE INDEX "lessons_updated_at_idx" ON "lessons" USING btree ("updated_at");
  CREATE INDEX "lessons_created_at_idx" ON "lessons" USING btree ("created_at");
  CREATE INDEX "lessons__status_idx" ON "lessons" USING btree ("_status");
  CREATE INDEX "_lessons_v_parent_idx" ON "_lessons_v" USING btree ("parent_id");
  CREATE INDEX "_lessons_v_version_version_lesson_id_idx" ON "_lessons_v" USING btree ("version_lesson_id");
  CREATE INDEX "_lessons_v_version_version_updated_at_idx" ON "_lessons_v" USING btree ("version_updated_at");
  CREATE INDEX "_lessons_v_version_version_created_at_idx" ON "_lessons_v" USING btree ("version_created_at");
  CREATE INDEX "_lessons_v_version_version__status_idx" ON "_lessons_v" USING btree ("version__status");
  CREATE INDEX "_lessons_v_created_at_idx" ON "_lessons_v" USING btree ("created_at");
  CREATE INDEX "_lessons_v_updated_at_idx" ON "_lessons_v" USING btree ("updated_at");
  CREATE INDEX "_lessons_v_latest_idx" ON "_lessons_v" USING btree ("latest");
  CREATE UNIQUE INDEX "detours_detour_id_idx" ON "detours" USING btree ("detour_id");
  CREATE INDEX "detours_updated_at_idx" ON "detours" USING btree ("updated_at");
  CREATE INDEX "detours_created_at_idx" ON "detours" USING btree ("created_at");
  CREATE INDEX "detours__status_idx" ON "detours" USING btree ("_status");
  CREATE INDEX "_detours_v_parent_idx" ON "_detours_v" USING btree ("parent_id");
  CREATE INDEX "_detours_v_version_version_detour_id_idx" ON "_detours_v" USING btree ("version_detour_id");
  CREATE INDEX "_detours_v_version_version_updated_at_idx" ON "_detours_v" USING btree ("version_updated_at");
  CREATE INDEX "_detours_v_version_version_created_at_idx" ON "_detours_v" USING btree ("version_created_at");
  CREATE INDEX "_detours_v_version_version__status_idx" ON "_detours_v" USING btree ("version__status");
  CREATE INDEX "_detours_v_created_at_idx" ON "_detours_v" USING btree ("created_at");
  CREATE INDEX "_detours_v_updated_at_idx" ON "_detours_v" USING btree ("updated_at");
  CREATE INDEX "_detours_v_latest_idx" ON "_detours_v" USING btree ("latest");
  CREATE INDEX "glossary_term_id_idx" ON "glossary" USING btree ("term_id");
  CREATE INDEX "glossary_updated_at_idx" ON "glossary" USING btree ("updated_at");
  CREATE INDEX "glossary_created_at_idx" ON "glossary" USING btree ("created_at");
  CREATE INDEX "glossary__status_idx" ON "glossary" USING btree ("_status");
  CREATE UNIQUE INDEX "termId_locale_idx" ON "glossary" USING btree ("term_id","locale");
  CREATE INDEX "_glossary_v_parent_idx" ON "_glossary_v" USING btree ("parent_id");
  CREATE INDEX "_glossary_v_version_version_term_id_idx" ON "_glossary_v" USING btree ("version_term_id");
  CREATE INDEX "_glossary_v_version_version_updated_at_idx" ON "_glossary_v" USING btree ("version_updated_at");
  CREATE INDEX "_glossary_v_version_version_created_at_idx" ON "_glossary_v" USING btree ("version_created_at");
  CREATE INDEX "_glossary_v_version_version__status_idx" ON "_glossary_v" USING btree ("version__status");
  CREATE INDEX "_glossary_v_created_at_idx" ON "_glossary_v" USING btree ("created_at");
  CREATE INDEX "_glossary_v_updated_at_idx" ON "_glossary_v" USING btree ("updated_at");
  CREATE INDEX "_glossary_v_latest_idx" ON "_glossary_v" USING btree ("latest");
  CREATE INDEX "version_termId_version_locale_idx" ON "_glossary_v" USING btree ("version_term_id","version_locale");
  CREATE INDEX "analogies_concept_idx" ON "analogies" USING btree ("concept");
  CREATE INDEX "analogies_updated_at_idx" ON "analogies" USING btree ("updated_at");
  CREATE INDEX "analogies_created_at_idx" ON "analogies" USING btree ("created_at");
  CREATE INDEX "analogies__status_idx" ON "analogies" USING btree ("_status");
  CREATE INDEX "_analogies_v_parent_idx" ON "_analogies_v" USING btree ("parent_id");
  CREATE INDEX "_analogies_v_version_version_concept_idx" ON "_analogies_v" USING btree ("version_concept");
  CREATE INDEX "_analogies_v_version_version_updated_at_idx" ON "_analogies_v" USING btree ("version_updated_at");
  CREATE INDEX "_analogies_v_version_version_created_at_idx" ON "_analogies_v" USING btree ("version_created_at");
  CREATE INDEX "_analogies_v_version_version__status_idx" ON "_analogies_v" USING btree ("version__status");
  CREATE INDEX "_analogies_v_created_at_idx" ON "_analogies_v" USING btree ("created_at");
  CREATE INDEX "_analogies_v_updated_at_idx" ON "_analogies_v" USING btree ("updated_at");
  CREATE INDEX "_analogies_v_latest_idx" ON "_analogies_v" USING btree ("latest");
  CREATE UNIQUE INDEX "concepts_concept_id_idx" ON "concepts" USING btree ("concept_id");
  CREATE INDEX "concepts_updated_at_idx" ON "concepts" USING btree ("updated_at");
  CREATE INDEX "concepts_created_at_idx" ON "concepts" USING btree ("created_at");
  CREATE INDEX "concepts_rels_order_idx" ON "concepts_rels" USING btree ("order");
  CREATE INDEX "concepts_rels_parent_idx" ON "concepts_rels" USING btree ("parent_id");
  CREATE INDEX "concepts_rels_path_idx" ON "concepts_rels" USING btree ("path");
  CREATE INDEX "concepts_rels_concepts_id_idx" ON "concepts_rels" USING btree ("concepts_id");
  CREATE INDEX "teacher_guides_lesson_id_idx" ON "teacher_guides" USING btree ("lesson_id");
  CREATE INDEX "teacher_guides_updated_at_idx" ON "teacher_guides" USING btree ("updated_at");
  CREATE INDEX "teacher_guides_created_at_idx" ON "teacher_guides" USING btree ("created_at");
  CREATE INDEX "teacher_guides__status_idx" ON "teacher_guides" USING btree ("_status");
  CREATE INDEX "_teacher_guides_v_parent_idx" ON "_teacher_guides_v" USING btree ("parent_id");
  CREATE INDEX "_teacher_guides_v_version_version_lesson_id_idx" ON "_teacher_guides_v" USING btree ("version_lesson_id");
  CREATE INDEX "_teacher_guides_v_version_version_updated_at_idx" ON "_teacher_guides_v" USING btree ("version_updated_at");
  CREATE INDEX "_teacher_guides_v_version_version_created_at_idx" ON "_teacher_guides_v" USING btree ("version_created_at");
  CREATE INDEX "_teacher_guides_v_version_version__status_idx" ON "_teacher_guides_v" USING btree ("version__status");
  CREATE INDEX "_teacher_guides_v_created_at_idx" ON "_teacher_guides_v" USING btree ("created_at");
  CREATE INDEX "_teacher_guides_v_updated_at_idx" ON "_teacher_guides_v" USING btree ("updated_at");
  CREATE INDEX "_teacher_guides_v_latest_idx" ON "_teacher_guides_v" USING btree ("latest");
  CREATE INDEX "media_updated_at_idx" ON "media" USING btree ("updated_at");
  CREATE INDEX "media_created_at_idx" ON "media" USING btree ("created_at");
  CREATE UNIQUE INDEX "media_filename_idx" ON "media" USING btree ("filename");
  CREATE INDEX "media_sizes_small_sizes_small_filename_idx" ON "media" USING btree ("sizes_small_filename");
  CREATE INDEX "media_sizes_medium_sizes_medium_filename_idx" ON "media" USING btree ("sizes_medium_filename");
  CREATE UNIQUE INDEX "audiences_audience_id_idx" ON "audiences" USING btree ("audience_id");
  CREATE INDEX "audiences_updated_at_idx" ON "audiences" USING btree ("updated_at");
  CREATE INDEX "audiences_created_at_idx" ON "audiences" USING btree ("created_at");
  CREATE INDEX "decisions_kind_idx" ON "decisions" USING btree ("kind");
  CREATE INDEX "decisions_status_idx" ON "decisions" USING btree ("status");
  CREATE INDEX "decisions_updated_at_idx" ON "decisions" USING btree ("updated_at");
  CREATE INDEX "decisions_created_at_idx" ON "decisions" USING btree ("created_at");
  CREATE INDEX "pipeline_runs_lesson_idx" ON "pipeline_runs" USING btree ("lesson_id");
  CREATE INDEX "pipeline_runs_updated_at_idx" ON "pipeline_runs" USING btree ("updated_at");
  CREATE INDEX "pipeline_runs_created_at_idx" ON "pipeline_runs" USING btree ("created_at");
  CREATE INDEX "events_actor_kind_idx" ON "events" USING btree ("actor_kind");
  CREATE INDEX "events_actor_id_idx" ON "events" USING btree ("actor_id");
  CREATE INDEX "events_action_idx" ON "events" USING btree ("action");
  CREATE INDEX "events_target_idx" ON "events" USING btree ("target");
  CREATE INDEX "events_updated_at_idx" ON "events" USING btree ("updated_at");
  CREATE INDEX "events_created_at_idx" ON "events" USING btree ("created_at");
  CREATE INDEX "feedback_updated_at_idx" ON "feedback" USING btree ("updated_at");
  CREATE INDEX "feedback_created_at_idx" ON "feedback" USING btree ("created_at");
  CREATE UNIQUE INDEX "agents_agent_id_idx" ON "agents" USING btree ("agent_id");
  CREATE INDEX "agents_updated_at_idx" ON "agents" USING btree ("updated_at");
  CREATE INDEX "agents_created_at_idx" ON "agents" USING btree ("created_at");
  CREATE UNIQUE INDEX "classroom_sessions_code_idx" ON "classroom_sessions" USING btree ("code");
  CREATE INDEX "classroom_sessions_expires_at_idx" ON "classroom_sessions" USING btree ("expires_at");
  CREATE INDEX "classroom_sessions_updated_at_idx" ON "classroom_sessions" USING btree ("updated_at");
  CREATE INDEX "classroom_sessions_created_at_idx" ON "classroom_sessions" USING btree ("created_at");
  CREATE INDEX "classroom_votes_session_idx" ON "classroom_votes" USING btree ("session_id");
  CREATE INDEX "classroom_votes_updated_at_idx" ON "classroom_votes" USING btree ("updated_at");
  CREATE INDEX "classroom_votes_created_at_idx" ON "classroom_votes" USING btree ("created_at");
  CREATE UNIQUE INDEX "session_blockId_itemId_participant_idx" ON "classroom_votes" USING btree ("session_id","block_id","item_id","participant");
  CREATE INDEX "users_passkeys_order_idx" ON "users_passkeys" USING btree ("_order");
  CREATE INDEX "users_passkeys_parent_id_idx" ON "users_passkeys" USING btree ("_parent_id");
  CREATE INDEX "users_agent_id_idx" ON "users" USING btree ("agent_id");
  CREATE INDEX "users_updated_at_idx" ON "users" USING btree ("updated_at");
  CREATE INDEX "users_created_at_idx" ON "users" USING btree ("created_at");
  CREATE INDEX "oauth_grants_kind_idx" ON "oauth_grants" USING btree ("kind");
  CREATE INDEX "oauth_grants_client_id_idx" ON "oauth_grants" USING btree ("client_id");
  CREATE UNIQUE INDEX "oauth_grants_token_hash_idx" ON "oauth_grants" USING btree ("token_hash");
  CREATE INDEX "oauth_grants_updated_at_idx" ON "oauth_grants" USING btree ("updated_at");
  CREATE INDEX "oauth_grants_created_at_idx" ON "oauth_grants" USING btree ("created_at");
  CREATE UNIQUE INDEX "payload_kv_key_idx" ON "payload_kv" USING btree ("key");
  CREATE INDEX "payload_locked_documents_global_slug_idx" ON "payload_locked_documents" USING btree ("global_slug");
  CREATE INDEX "payload_locked_documents_updated_at_idx" ON "payload_locked_documents" USING btree ("updated_at");
  CREATE INDEX "payload_locked_documents_created_at_idx" ON "payload_locked_documents" USING btree ("created_at");
  CREATE INDEX "payload_locked_documents_rels_order_idx" ON "payload_locked_documents_rels" USING btree ("order");
  CREATE INDEX "payload_locked_documents_rels_parent_idx" ON "payload_locked_documents_rels" USING btree ("parent_id");
  CREATE INDEX "payload_locked_documents_rels_path_idx" ON "payload_locked_documents_rels" USING btree ("path");
  CREATE INDEX "payload_locked_documents_rels_lessons_id_idx" ON "payload_locked_documents_rels" USING btree ("lessons_id");
  CREATE INDEX "payload_locked_documents_rels_detours_id_idx" ON "payload_locked_documents_rels" USING btree ("detours_id");
  CREATE INDEX "payload_locked_documents_rels_glossary_id_idx" ON "payload_locked_documents_rels" USING btree ("glossary_id");
  CREATE INDEX "payload_locked_documents_rels_analogies_id_idx" ON "payload_locked_documents_rels" USING btree ("analogies_id");
  CREATE INDEX "payload_locked_documents_rels_concepts_id_idx" ON "payload_locked_documents_rels" USING btree ("concepts_id");
  CREATE INDEX "payload_locked_documents_rels_teacher_guides_id_idx" ON "payload_locked_documents_rels" USING btree ("teacher_guides_id");
  CREATE INDEX "payload_locked_documents_rels_media_id_idx" ON "payload_locked_documents_rels" USING btree ("media_id");
  CREATE INDEX "payload_locked_documents_rels_audiences_id_idx" ON "payload_locked_documents_rels" USING btree ("audiences_id");
  CREATE INDEX "payload_locked_documents_rels_decisions_id_idx" ON "payload_locked_documents_rels" USING btree ("decisions_id");
  CREATE INDEX "payload_locked_documents_rels_pipeline_runs_id_idx" ON "payload_locked_documents_rels" USING btree ("pipeline_runs_id");
  CREATE INDEX "payload_locked_documents_rels_events_id_idx" ON "payload_locked_documents_rels" USING btree ("events_id");
  CREATE INDEX "payload_locked_documents_rels_feedback_id_idx" ON "payload_locked_documents_rels" USING btree ("feedback_id");
  CREATE INDEX "payload_locked_documents_rels_agents_id_idx" ON "payload_locked_documents_rels" USING btree ("agents_id");
  CREATE INDEX "payload_locked_documents_rels_classroom_sessions_id_idx" ON "payload_locked_documents_rels" USING btree ("classroom_sessions_id");
  CREATE INDEX "payload_locked_documents_rels_classroom_votes_id_idx" ON "payload_locked_documents_rels" USING btree ("classroom_votes_id");
  CREATE INDEX "payload_locked_documents_rels_users_id_idx" ON "payload_locked_documents_rels" USING btree ("users_id");
  CREATE INDEX "payload_locked_documents_rels_oauth_grants_id_idx" ON "payload_locked_documents_rels" USING btree ("oauth_grants_id");
  CREATE INDEX "payload_preferences_key_idx" ON "payload_preferences" USING btree ("key");
  CREATE INDEX "payload_preferences_updated_at_idx" ON "payload_preferences" USING btree ("updated_at");
  CREATE INDEX "payload_preferences_created_at_idx" ON "payload_preferences" USING btree ("created_at");
  CREATE INDEX "payload_preferences_rels_order_idx" ON "payload_preferences_rels" USING btree ("order");
  CREATE INDEX "payload_preferences_rels_parent_idx" ON "payload_preferences_rels" USING btree ("parent_id");
  CREATE INDEX "payload_preferences_rels_path_idx" ON "payload_preferences_rels" USING btree ("path");
  CREATE INDEX "payload_preferences_rels_users_id_idx" ON "payload_preferences_rels" USING btree ("users_id");
  CREATE INDEX "payload_migrations_updated_at_idx" ON "payload_migrations" USING btree ("updated_at");
  CREATE INDEX "payload_migrations_created_at_idx" ON "payload_migrations" USING btree ("created_at");
  CREATE INDEX "_constitution_v_created_at_idx" ON "_constitution_v" USING btree ("created_at");
  CREATE INDEX "_constitution_v_updated_at_idx" ON "_constitution_v" USING btree ("updated_at");
  CREATE INDEX "_autonomy_v_created_at_idx" ON "_autonomy_v" USING btree ("created_at");
  CREATE INDEX "_autonomy_v_updated_at_idx" ON "_autonomy_v" USING btree ("updated_at");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP TABLE "lessons" CASCADE;
  DROP TABLE "_lessons_v" CASCADE;
  DROP TABLE "detours" CASCADE;
  DROP TABLE "_detours_v" CASCADE;
  DROP TABLE "glossary" CASCADE;
  DROP TABLE "_glossary_v" CASCADE;
  DROP TABLE "analogies" CASCADE;
  DROP TABLE "_analogies_v" CASCADE;
  DROP TABLE "concepts" CASCADE;
  DROP TABLE "concepts_rels" CASCADE;
  DROP TABLE "teacher_guides" CASCADE;
  DROP TABLE "_teacher_guides_v" CASCADE;
  DROP TABLE "media" CASCADE;
  DROP TABLE "audiences" CASCADE;
  DROP TABLE "decisions" CASCADE;
  DROP TABLE "pipeline_runs" CASCADE;
  DROP TABLE "events" CASCADE;
  DROP TABLE "feedback" CASCADE;
  DROP TABLE "agents" CASCADE;
  DROP TABLE "classroom_sessions" CASCADE;
  DROP TABLE "classroom_votes" CASCADE;
  DROP TABLE "users_passkeys" CASCADE;
  DROP TABLE "users" CASCADE;
  DROP TABLE "oauth_grants" CASCADE;
  DROP TABLE "payload_kv" CASCADE;
  DROP TABLE "payload_locked_documents" CASCADE;
  DROP TABLE "payload_locked_documents_rels" CASCADE;
  DROP TABLE "payload_preferences" CASCADE;
  DROP TABLE "payload_preferences_rels" CASCADE;
  DROP TABLE "payload_migrations" CASCADE;
  DROP TABLE "constitution" CASCADE;
  DROP TABLE "_constitution_v" CASCADE;
  DROP TABLE "autonomy" CASCADE;
  DROP TABLE "_autonomy_v" CASCADE;
  DROP TABLE "budget" CASCADE;
  DROP TYPE "public"."enum_lessons_status";
  DROP TYPE "public"."enum__lessons_v_version_status";
  DROP TYPE "public"."enum_detours_status";
  DROP TYPE "public"."enum__detours_v_version_status";
  DROP TYPE "public"."enum_glossary_locale";
  DROP TYPE "public"."enum_glossary_status";
  DROP TYPE "public"."enum__glossary_v_version_locale";
  DROP TYPE "public"."enum__glossary_v_version_status";
  DROP TYPE "public"."enum_analogies_status";
  DROP TYPE "public"."enum__analogies_v_version_status";
  DROP TYPE "public"."enum_teacher_guides_locale";
  DROP TYPE "public"."enum_teacher_guides_status";
  DROP TYPE "public"."enum__teacher_guides_v_version_locale";
  DROP TYPE "public"."enum__teacher_guides_v_version_status";
  DROP TYPE "public"."enum_media_licence";
  DROP TYPE "public"."enum_media_review_status";
  DROP TYPE "public"."enum_decisions_kind";
  DROP TYPE "public"."enum_decisions_status";
  DROP TYPE "public"."enum_pipeline_runs_stage";
  DROP TYPE "public"."enum_pipeline_runs_status";
  DROP TYPE "public"."enum_events_actor_kind";
  DROP TYPE "public"."enum_feedback_role";
  DROP TYPE "public"."enum_feedback_status";
  DROP TYPE "public"."enum_users_role";
  DROP TYPE "public"."enum_oauth_grants_kind";`)
}
