import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TABLE "_agents_v" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"parent_id" integer,
  	"version_agent_id" varchar NOT NULL,
  	"version_enabled" boolean DEFAULT true,
  	"version_profile" varchar,
  	"version_permissions" jsonb,
  	"version_benchmark_stale" boolean DEFAULT false,
  	"version_tier" varchar,
  	"version_benchmark" jsonb,
  	"version_cost_usd" numeric DEFAULT 0,
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  ALTER TABLE "pipeline_runs" ALTER COLUMN "stage" SET DATA TYPE text;
  ALTER TABLE "pipeline_runs" ALTER COLUMN "stage" SET DEFAULT 'plan'::text;
  DROP TYPE "public"."enum_pipeline_runs_stage";
  CREATE TYPE "public"."enum_pipeline_runs_stage" AS ENUM('plan', 'draft', 'analogies', 'compose', 'localise', 'review', 'revise', 're-review', 'resolve', 'teacher-guide', 'creator-preview', 'done');
  ALTER TABLE "pipeline_runs" ALTER COLUMN "stage" SET DEFAULT 'plan'::"public"."enum_pipeline_runs_stage";
  ALTER TABLE "pipeline_runs" ALTER COLUMN "stage" SET DATA TYPE "public"."enum_pipeline_runs_stage" USING "stage"::"public"."enum_pipeline_runs_stage";
  ALTER TABLE "lessons" ADD COLUMN "reviews" jsonb;
  ALTER TABLE "_lessons_v" ADD COLUMN "version_reviews" jsonb;
  ALTER TABLE "pipeline_runs" ADD COLUMN "lesson_slug" varchar;
  ALTER TABLE "pipeline_runs" ADD COLUMN "urgent" boolean DEFAULT false;
  ALTER TABLE "agents" ADD COLUMN "profile" varchar;
  ALTER TABLE "agents" ADD COLUMN "permissions" jsonb;
  ALTER TABLE "agents" ADD COLUMN "benchmark_stale" boolean DEFAULT false;
  ALTER TABLE "_agents_v" ADD CONSTRAINT "_agents_v_parent_id_agents_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."agents"("id") ON DELETE set null ON UPDATE no action;
  CREATE INDEX "_agents_v_parent_idx" ON "_agents_v" USING btree ("parent_id");
  CREATE INDEX "_agents_v_version_version_agent_id_idx" ON "_agents_v" USING btree ("version_agent_id");
  CREATE INDEX "_agents_v_version_version_updated_at_idx" ON "_agents_v" USING btree ("version_updated_at");
  CREATE INDEX "_agents_v_version_version_created_at_idx" ON "_agents_v" USING btree ("version_created_at");
  CREATE INDEX "_agents_v_created_at_idx" ON "_agents_v" USING btree ("created_at");
  CREATE INDEX "_agents_v_updated_at_idx" ON "_agents_v" USING btree ("updated_at");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP TABLE "_agents_v" CASCADE;
  ALTER TABLE "pipeline_runs" ALTER COLUMN "stage" SET DATA TYPE text;
  ALTER TABLE "pipeline_runs" ALTER COLUMN "stage" SET DEFAULT 'plan'::text;
  DROP TYPE "public"."enum_pipeline_runs_stage";
  CREATE TYPE "public"."enum_pipeline_runs_stage" AS ENUM('plan', 'draft', 'enrich', 'localise', 'review', 'revise', 'validate', 'teacher-guide', 'creator-preview', 'done', 'paused', 'failed');
  ALTER TABLE "pipeline_runs" ALTER COLUMN "stage" SET DEFAULT 'plan'::"public"."enum_pipeline_runs_stage";
  ALTER TABLE "pipeline_runs" ALTER COLUMN "stage" SET DATA TYPE "public"."enum_pipeline_runs_stage" USING "stage"::"public"."enum_pipeline_runs_stage";
  ALTER TABLE "lessons" DROP COLUMN "reviews";
  ALTER TABLE "_lessons_v" DROP COLUMN "version_reviews";
  ALTER TABLE "pipeline_runs" DROP COLUMN "lesson_slug";
  ALTER TABLE "pipeline_runs" DROP COLUMN "urgent";
  ALTER TABLE "agents" DROP COLUMN "profile";
  ALTER TABLE "agents" DROP COLUMN "permissions";
  ALTER TABLE "agents" DROP COLUMN "benchmark_stale";`)
}
