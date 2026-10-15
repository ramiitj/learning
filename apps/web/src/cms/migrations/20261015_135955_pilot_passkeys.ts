import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_usability_findings_locale" AS ENUM('en', 'hi', 'te');
  CREATE TYPE "public"."enum_usability_findings_mode" AS ENUM('personal', 'classroom');
  CREATE TYPE "public"."enum_usability_findings_severity" AS ENUM('blocker', 'major', 'minor');
  CREATE TYPE "public"."enum_usability_findings_source" AS ENUM('usability-session', 'teacher-report', 'analytics', 'review');
  CREATE TYPE "public"."enum_usability_findings_status" AS ENUM('open', 'planned', 'fixed', 'wont-fix');
  CREATE TABLE "usability_findings" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"lesson" varchar,
  	"locale" "enum_usability_findings_locale",
  	"mode" "enum_usability_findings_mode",
  	"observed" varchar NOT NULL,
  	"severity" "enum_usability_findings_severity" DEFAULT 'minor' NOT NULL,
  	"source" "enum_usability_findings_source" NOT NULL,
  	"suggested_change" varchar,
  	"status" "enum_usability_findings_status" DEFAULT 'open' NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  ALTER TABLE "users_passkeys" ADD COLUMN "added_at" timestamp(3) with time zone;
  ALTER TABLE "users_passkeys" ADD COLUMN "last_used_at" timestamp(3) with time zone;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "usability_findings_id" integer;
  CREATE INDEX "usability_findings_lesson_idx" ON "usability_findings" USING btree ("lesson");
  CREATE INDEX "usability_findings_severity_idx" ON "usability_findings" USING btree ("severity");
  CREATE INDEX "usability_findings_status_idx" ON "usability_findings" USING btree ("status");
  CREATE INDEX "usability_findings_updated_at_idx" ON "usability_findings" USING btree ("updated_at");
  CREATE INDEX "usability_findings_created_at_idx" ON "usability_findings" USING btree ("created_at");
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_usability_findings_fk" FOREIGN KEY ("usability_findings_id") REFERENCES "public"."usability_findings"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "payload_locked_documents_rels_usability_findings_id_idx" ON "payload_locked_documents_rels" USING btree ("usability_findings_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "usability_findings" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "usability_findings" CASCADE;
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_usability_findings_fk";
  
  DROP INDEX "payload_locked_documents_rels_usability_findings_id_idx";
  ALTER TABLE "users_passkeys" DROP COLUMN "added_at";
  ALTER TABLE "users_passkeys" DROP COLUMN "last_used_at";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "usability_findings_id";
  DROP TYPE "public"."enum_usability_findings_locale";
  DROP TYPE "public"."enum_usability_findings_mode";
  DROP TYPE "public"."enum_usability_findings_severity";
  DROP TYPE "public"."enum_usability_findings_source";
  DROP TYPE "public"."enum_usability_findings_status";`)
}
