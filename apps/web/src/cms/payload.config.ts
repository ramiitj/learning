import path from "node:path";
import { fileURLToPath } from "node:url";
import { postgresAdapter, sql } from "@payloadcms/db-postgres";
import { buildConfig } from "payload";
import sharp from "sharp";
import { Lessons } from "./collections/Lessons";
import { Analogies, Audiences, Concepts, Detours, Glossary, Media, TeacherGuides } from "./collections/Content";
import { ClassroomSessions, ClassroomVotes } from "./collections/Classroom";
import { Agents, Decisions, Events, Feedback, PipelineRuns } from "./collections/System";
import { Users } from "./collections/Users";
import { OAuthGrants } from "./collections/OAuth";
import { AnalyticsDaily } from "./collections/Analytics";
import { Autonomy, Budget, Constitution } from "./globals";

const dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * The content platform and the Creator Console (docs/03, docs/10). Payload
 * runs inside the Next.js app; its admin is the console, at /console.
 */
export default buildConfig({
  secret: process.env.PAYLOAD_SECRET ?? "",
  serverURL: process.env.APP_ORIGIN,
  routes: { admin: "/console", api: "/api/cms" },
  admin: {
    user: "users",
    meta: { titleSuffix: " · Creator Console" },
    components: {
      beforeLogin: ["/cms/components/PasskeySignIn#PasskeySignIn"],
      beforeDashboard: ["/cms/components/Overview#Overview"],
      actions: ["/cms/components/ReauthButton#ReauthButton"],
      afterNavLinks: ["/cms/components/NavLinks#NavLinks"],
      graphics: { Logo: "/cms/components/Brand#Logo", Icon: "/cms/components/Brand#Icon" },
      views: {
        command: { Component: "/cms/views/CommandView#CommandView", path: "/command" },
        translations: { Component: "/cms/views/TranslationsView#TranslationsView", path: "/translations" },
        components: { Component: "/cms/views/ComponentsView#ComponentsView", path: "/components" },
        analytics: { Component: "/cms/views/AnalyticsView#AnalyticsView", path: "/analytics" },
      },
    },
    importMap: { baseDir: path.resolve(dirname, "..") },
  },
  collections: [Lessons, Detours, Glossary, Analogies, Concepts, TeacherGuides, Media, Audiences, Decisions, PipelineRuns, Events, Feedback, Agents, ClassroomSessions, ClassroomVotes, Users, OAuthGrants, AnalyticsDaily],
  globals: [Constitution, Autonomy, Budget],
  db: postgresAdapter({
    pool: { connectionString: process.env.DATABASE_URI ?? "" },
    push: process.env.NODE_ENV !== "production",
    migrationDir: path.resolve(dirname, "migrations"),
  }),
  sharp,
  graphQL: { disable: true },
  telemetry: false,
  typescript: { outputFile: path.resolve(dirname, "payload-types.ts") },
  upload: { limits: { fileSize: 50_000_000 } },
  onInit: async (payload) => {
    // The event log is append-only at the database level: not even the creator can rewrite history.
    await payload.db.drizzle.execute(
      sql.raw(`
        CREATE OR REPLACE FUNCTION lm_events_append_only() RETURNS trigger AS $$
        BEGIN RAISE EXCEPTION 'the event log is append-only'; END; $$ LANGUAGE plpgsql;
        DO $$ BEGIN
          IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'lm_events_append_only') THEN
            CREATE TRIGGER lm_events_append_only BEFORE UPDATE OR DELETE ON events FOR EACH ROW EXECUTE FUNCTION lm_events_append_only();
          END IF;
        END $$;`),
    );
  },
});
