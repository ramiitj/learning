import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TABLE "analytics_daily" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"day" varchar NOT NULL,
  	"lesson_id" varchar NOT NULL,
  	"locale" varchar NOT NULL,
  	"mode" varchar NOT NULL,
  	"metric" varchar NOT NULL,
  	"key" varchar DEFAULT '' NOT NULL,
  	"count" numeric DEFAULT 0 NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "analytics_daily_id" integer;
  CREATE INDEX "analytics_daily_day_idx" ON "analytics_daily" USING btree ("day");
  CREATE INDEX "analytics_daily_lesson_id_idx" ON "analytics_daily" USING btree ("lesson_id");
  CREATE INDEX "analytics_daily_updated_at_idx" ON "analytics_daily" USING btree ("updated_at");
  CREATE INDEX "analytics_daily_created_at_idx" ON "analytics_daily" USING btree ("created_at");
  CREATE UNIQUE INDEX "day_lessonId_locale_mode_metric_key_idx" ON "analytics_daily" USING btree ("day","lesson_id","locale","mode","metric","key");
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_analytics_daily_fk" FOREIGN KEY ("analytics_daily_id") REFERENCES "public"."analytics_daily"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "payload_locked_documents_rels_analytics_daily_id_idx" ON "payload_locked_documents_rels" USING btree ("analytics_daily_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "analytics_daily" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "analytics_daily" CASCADE;
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_analytics_daily_fk";
  
  DROP INDEX "payload_locked_documents_rels_analytics_daily_id_idx";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "analytics_daily_id";`)
}
