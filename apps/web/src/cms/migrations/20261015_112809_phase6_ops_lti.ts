import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_errors_source" AS ENUM('server', 'client');
  CREATE TYPE "public"."enum_incidents_severity" AS ENUM('minor', 'serious');
  CREATE TYPE "public"."enum_incidents_status" AS ENUM('open', 'mitigated', 'reviewed', 'closed');
  ALTER TYPE "public"."enum_decisions_kind" ADD VALUE 'incident' BEFORE 'other';
  CREATE TABLE "errors" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"fingerprint" varchar NOT NULL,
  	"source" "enum_errors_source" NOT NULL,
  	"message" varchar NOT NULL,
  	"stack" varchar,
  	"route" varchar,
  	"release" varchar,
  	"count" numeric DEFAULT 1 NOT NULL,
  	"first_seen" timestamp(3) with time zone NOT NULL,
  	"last_seen" timestamp(3) with time zone NOT NULL,
  	"window_start" timestamp(3) with time zone,
  	"window_count" numeric DEFAULT 0,
  	"spike_alerted_at" timestamp(3) with time zone,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "incidents" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"title" varchar NOT NULL,
  	"severity" "enum_incidents_severity" DEFAULT 'minor' NOT NULL,
  	"status" "enum_incidents_status" DEFAULT 'open' NOT NULL,
  	"what_happened" varchar NOT NULL,
  	"cause" varchar,
  	"prevention_step" varchar,
  	"schools_informed_at" timestamp(3) with time zone,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "incidents_texts" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer NOT NULL,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"text" varchar
  );
  
  CREATE TABLE "incidents_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"feedback_id" integer
  );
  
  CREATE TABLE "lti_platforms" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar NOT NULL,
  	"enabled" boolean DEFAULT false,
  	"issuer" varchar NOT NULL,
  	"client_id" varchar NOT NULL,
  	"auth_login_url" varchar NOT NULL,
  	"auth_token_url" varchar,
  	"jwks_url" varchar NOT NULL,
  	"lrs_endpoint" varchar,
  	"lrs_key" varchar,
  	"lrs_secret" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "lti_platforms_texts" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer NOT NULL,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"text" varchar
  );
  
  CREATE TABLE "lti_nonces" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"nonce_hash" varchar NOT NULL,
  	"expires_at" timestamp(3) with time zone NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "errors_id" integer;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "incidents_id" integer;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "lti_platforms_id" integer;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "lti_nonces_id" integer;
  ALTER TABLE "incidents_texts" ADD CONSTRAINT "incidents_texts_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."incidents"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "incidents_rels" ADD CONSTRAINT "incidents_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."incidents"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "incidents_rels" ADD CONSTRAINT "incidents_rels_feedback_fk" FOREIGN KEY ("feedback_id") REFERENCES "public"."feedback"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "lti_platforms_texts" ADD CONSTRAINT "lti_platforms_texts_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."lti_platforms"("id") ON DELETE cascade ON UPDATE no action;
  CREATE UNIQUE INDEX "errors_fingerprint_idx" ON "errors" USING btree ("fingerprint");
  CREATE INDEX "errors_last_seen_idx" ON "errors" USING btree ("last_seen");
  CREATE INDEX "errors_updated_at_idx" ON "errors" USING btree ("updated_at");
  CREATE INDEX "errors_created_at_idx" ON "errors" USING btree ("created_at");
  CREATE INDEX "incidents_severity_idx" ON "incidents" USING btree ("severity");
  CREATE INDEX "incidents_status_idx" ON "incidents" USING btree ("status");
  CREATE INDEX "incidents_updated_at_idx" ON "incidents" USING btree ("updated_at");
  CREATE INDEX "incidents_created_at_idx" ON "incidents" USING btree ("created_at");
  CREATE INDEX "incidents_texts_order_parent" ON "incidents_texts" USING btree ("order","parent_id");
  CREATE INDEX "incidents_rels_order_idx" ON "incidents_rels" USING btree ("order");
  CREATE INDEX "incidents_rels_parent_idx" ON "incidents_rels" USING btree ("parent_id");
  CREATE INDEX "incidents_rels_path_idx" ON "incidents_rels" USING btree ("path");
  CREATE INDEX "incidents_rels_feedback_id_idx" ON "incidents_rels" USING btree ("feedback_id");
  CREATE INDEX "lti_platforms_issuer_idx" ON "lti_platforms" USING btree ("issuer");
  CREATE INDEX "lti_platforms_updated_at_idx" ON "lti_platforms" USING btree ("updated_at");
  CREATE INDEX "lti_platforms_created_at_idx" ON "lti_platforms" USING btree ("created_at");
  CREATE UNIQUE INDEX "issuer_clientId_idx" ON "lti_platforms" USING btree ("issuer","client_id");
  CREATE INDEX "lti_platforms_texts_order_parent" ON "lti_platforms_texts" USING btree ("order","parent_id");
  CREATE UNIQUE INDEX "lti_nonces_nonce_hash_idx" ON "lti_nonces" USING btree ("nonce_hash");
  CREATE INDEX "lti_nonces_expires_at_idx" ON "lti_nonces" USING btree ("expires_at");
  CREATE INDEX "lti_nonces_updated_at_idx" ON "lti_nonces" USING btree ("updated_at");
  CREATE INDEX "lti_nonces_created_at_idx" ON "lti_nonces" USING btree ("created_at");
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_errors_fk" FOREIGN KEY ("errors_id") REFERENCES "public"."errors"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_incidents_fk" FOREIGN KEY ("incidents_id") REFERENCES "public"."incidents"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_lti_platforms_fk" FOREIGN KEY ("lti_platforms_id") REFERENCES "public"."lti_platforms"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_lti_nonces_fk" FOREIGN KEY ("lti_nonces_id") REFERENCES "public"."lti_nonces"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "payload_locked_documents_rels_errors_id_idx" ON "payload_locked_documents_rels" USING btree ("errors_id");
  CREATE INDEX "payload_locked_documents_rels_incidents_id_idx" ON "payload_locked_documents_rels" USING btree ("incidents_id");
  CREATE INDEX "payload_locked_documents_rels_lti_platforms_id_idx" ON "payload_locked_documents_rels" USING btree ("lti_platforms_id");
  CREATE INDEX "payload_locked_documents_rels_lti_nonces_id_idx" ON "payload_locked_documents_rels" USING btree ("lti_nonces_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "errors" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "incidents" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "incidents_texts" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "incidents_rels" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "lti_platforms" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "lti_platforms_texts" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "lti_nonces" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "errors" CASCADE;
  DROP TABLE "incidents" CASCADE;
  DROP TABLE "incidents_texts" CASCADE;
  DROP TABLE "incidents_rels" CASCADE;
  DROP TABLE "lti_platforms" CASCADE;
  DROP TABLE "lti_platforms_texts" CASCADE;
  DROP TABLE "lti_nonces" CASCADE;
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_errors_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_incidents_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_lti_platforms_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_lti_nonces_fk";
  
  ALTER TABLE "decisions" ALTER COLUMN "kind" SET DATA TYPE text;
  DROP TYPE "public"."enum_decisions_kind";
  CREATE TYPE "public"."enum_decisions_kind" AS ENUM('publish', 'conflict', 'new-component', 'new-agent', 'permission-change', 'amendment', 'schema-change', 'learner-data', 'budget', 'other');
  ALTER TABLE "decisions" ALTER COLUMN "kind" SET DATA TYPE "public"."enum_decisions_kind" USING "kind"::"public"."enum_decisions_kind";
  DROP INDEX "payload_locked_documents_rels_errors_id_idx";
  DROP INDEX "payload_locked_documents_rels_incidents_id_idx";
  DROP INDEX "payload_locked_documents_rels_lti_platforms_id_idx";
  DROP INDEX "payload_locked_documents_rels_lti_nonces_id_idx";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "errors_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "incidents_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "lti_platforms_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "lti_nonces_id";
  DROP TYPE "public"."enum_errors_source";
  DROP TYPE "public"."enum_incidents_severity";
  DROP TYPE "public"."enum_incidents_status";`)
}
