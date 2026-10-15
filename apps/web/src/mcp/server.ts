import { readFileSync } from "node:fs";
import path from "node:path";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { Payload } from "payload";
import { z } from "zod";
import { contracts } from "@lm/primitives/contracts";
import { componentMessages } from "@lm/primitives/messages";
import { STAGE_ORDER, type Block, type Lesson } from "@lm/schema";
import { previewUrl } from "@/auth/session";
import { routing } from "@/i18n/routing";
import { repoRoot, validateWithCms } from "@/cms/validation";

type User = Record<string, unknown> & { id: string | number };
const json = (data: unknown) => ({ content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }] });
const failure = (message: string) => ({ content: [{ type: "text" as const, text: message }], isError: true });

/**
 * The authoring connector (docs/03). Every tool acts as the creator who
 * approved the connection, through the same access rules as the console, so
 * drafts only: there is deliberately no tool that publishes.
 */
export function buildMcpServer(payload: Payload, user: User) {
  const server = new McpServer({ name: "learning-magazine", version: "1.0.0" }, { instructions: "Authoring tools for the interactive learning magazine. Read get_schema first. Drafts only; publishing needs the creator's approval via request_publish." });
  const as = { user: user as never, overrideAccess: false, context: { reason: "via MCP connector" } };

  async function findLesson(lessonId: string) {
    const { docs } = await payload.find({ collection: "lessons", where: { lessonId: { equals: lessonId } }, limit: 1, draft: true, ...as });
    return docs[0] ?? null;
  }
  async function saveDoc(id: string | number, doc: Lesson) {
    const saved = await payload.update({ collection: "lessons", id, data: { doc: doc as never, _status: "draft" }, draft: true, ...as });
    return saved.validation;
  }
  async function editLesson(lessonId: string, edit: (doc: Lesson) => string | void) {
    const found = await findLesson(lessonId);
    if (!found) return failure(`No lesson "${lessonId}". Use list_lessons or create_draft.`);
    const doc = structuredClone(found.doc) as unknown as Lesson;
    const problem = edit(doc);
    if (problem) return failure(problem);
    return json({ saved: "draft", validation: await saveDoc(found.id, doc) });
  }
  const mergeStrings = (doc: Lesson, strings?: Record<string, Record<string, string>>) => {
    for (const [locale, table] of Object.entries(strings ?? {})) doc.strings[locale] = { ...(doc.strings[locale] ?? {}), ...table };
  };
  const blockSchema = z.object({ id: z.string(), type: z.string(), componentVersion: z.string(), config: z.record(z.unknown()), depth: z.enum(["core", "deeper", "deepest"]).optional(), classroom: z.record(z.unknown()).optional(), detours: z.array(z.string()).optional(), glossaryTerms: z.array(z.string()).optional() });
  const stringsSchema = z.record(z.record(z.string())).optional().describe("Strings to add or change, by locale then key. Write English; other locales are for the Localisation Specialist.");

  server.registerTool("list_lessons", { title: "List lessons", description: "Every lesson with its status and latest validation result." }, async () => {
    const { docs } = await payload.find({ collection: "lessons", limit: 500, draft: true, depth: 0, ...as });
    return json(docs.map((d) => ({ lessonId: d.lessonId, title: d.title, status: d._status, updatedAt: d.updatedAt, validation: d.validation ? { passed: (d.validation as { passed: boolean }).passed, errors: (d.validation as { errors: number }).errors, warnings: (d.validation as { warnings: number }).warnings } : null })));
  });

  server.registerTool("get_lesson", { title: "Get a lesson", description: "The lesson document (latest draft) and its validation report.", inputSchema: { lessonId: z.string() } }, async ({ lessonId }) => {
    const l = await findLesson(lessonId);
    return l ? json({ status: l._status, doc: l.doc, validation: l.validation }) : failure(`No lesson "${lessonId}".`);
  });

  server.registerTool("get_schema", { title: "Get the lesson schema", description: "The lesson JSON Schema, the stage order and the current platform constitution." }, async () => {
    const root = repoRoot();
    const constitution = await payload.findGlobal({ slug: "constitution", ...as }).catch(() => null);
    return json({
      stages: STAGE_ORDER,
      schema: JSON.parse(readFileSync(path.join(root, "schemas/lesson.schema.json"), "utf8")),
      constitution: (constitution as { text?: string } | null)?.text ?? readFileSync(path.join(root, "platform/constitution.md"), "utf8"),
    });
  });

  server.registerTool("list_components", { title: "List components", description: "Every registered component: its type, versions, the learner act it asks for, its config contract and its first-use hint." }, async () =>
    json(contracts.map((c) => ({ type: c.type, versions: c.versions, act: c.act, configSchema: c.configSchema, howTo: componentMessages[c.type]?.en?.howto }))),
  );

  server.registerTool("search_concepts", { title: "Search the concept graph", description: "Concepts matching a query, with their prerequisites.", inputSchema: { query: z.string().default("") } }, async ({ query }) => {
    const { docs } = await payload.find({ collection: "concepts", where: query ? { name: { like: query } } : {}, limit: 50, depth: 1, ...as });
    return json(docs.map((c) => ({ conceptId: c.conceptId, name: c.name, description: c.description, prerequisites: (c.prerequisites ?? []).map((p) => (typeof p === "object" ? p.name : p)) })));
  });

  server.registerTool("get_analogies", { title: "Get analogies", description: "Analogies from the shared bank, optionally for one concept.", inputSchema: { concept: z.string().optional() } }, async ({ concept }) => {
    const { docs } = await payload.find({ collection: "analogies", where: concept ? { concept: { like: concept } } : {}, limit: 100, draft: true, depth: 0, ...as });
    return json(docs.map(({ concept, source, mappings, breakPoint, fading, localeVariants }) => ({ concept, source, mappings, breakPoint, fading, localeVariants })));
  });

  server.registerTool("get_glossary", { title: "Get the glossary", description: "Glossary entries, optionally for one locale.", inputSchema: { locale: z.enum(["en", "hi", "te"]).optional() } }, async ({ locale }) => {
    const { docs } = await payload.find({ collection: "glossary", where: locale ? { locale: { equals: locale } } : {}, limit: 5000, draft: true, depth: 0, ...as });
    return json(docs.map(({ termId, locale, term, definition, _status }) => ({ termId, locale, term, definition, status: _status })));
  });

  server.registerTool(
    "create_draft",
    { title: "Create a draft lesson", description: "Creates a new lesson as a draft and returns its validation report.", inputSchema: { doc: z.record(z.unknown()).describe("A complete lesson document matching get_schema.") } },
    async ({ doc }) => {
      const lessonId = String(doc.id ?? "");
      if (!/^[a-z0-9-]+$/.test(lessonId)) return failure("doc.id must use lowercase letters, digits and hyphens.");
      if (await findLesson(lessonId)) return failure(`"${lessonId}" exists; edit it with update_block, insert_block or remove_block.`);
      const created = await payload.create({ collection: "lessons", data: { lessonId, doc: { ...doc, status: "draft" } as never, _status: "draft" }, draft: true, ...as });
      return json({ saved: "draft", lessonId, validation: created.validation });
    },
  );

  server.registerTool(
    "update_block",
    { title: "Update a block", description: "Replaces a block (same id) and/or changes strings, then validates.", inputSchema: { lessonId: z.string(), blockId: z.string(), block: blockSchema.optional(), strings: stringsSchema } },
    async ({ lessonId, blockId, block, strings }) =>
      editLesson(lessonId, (doc) => {
        const stage = doc.stages.find((s) => s.blocks.some((b) => b.id === blockId));
        if (!stage) return `No block "${blockId}".`;
        if (block) {
          if (block.id !== blockId) return "To rename a block, remove it and insert a new one.";
          stage.blocks = stage.blocks.map((b) => (b.id === blockId ? (block as Block) : b));
        }
        mergeStrings(doc, strings);
      }),
  );

  server.registerTool(
    "insert_block",
    { title: "Insert a block", description: "Inserts a block into a stage, after a given block or at the end, then validates.", inputSchema: { lessonId: z.string(), stage: z.enum(STAGE_ORDER as [string, ...string[]]), afterBlockId: z.string().optional(), block: blockSchema, strings: stringsSchema } },
    async ({ lessonId, stage, afterBlockId, block, strings }) =>
      editLesson(lessonId, (doc) => {
        if (doc.stages.some((s) => s.blocks.some((b) => b.id === block.id))) return `Block id "${block.id}" is taken.`;
        let s = doc.stages.find((x) => x.stage === stage);
        if (!s) {
          s = { stage: stage as Lesson["stages"][number]["stage"], blocks: [] };
          doc.stages.push(s);
          doc.stages.sort((a, b) => STAGE_ORDER.indexOf(a.stage) - STAGE_ORDER.indexOf(b.stage));
        }
        const i = afterBlockId ? s.blocks.findIndex((b) => b.id === afterBlockId) : -1;
        if (afterBlockId && i < 0) return `No block "${afterBlockId}" in ${stage}.`;
        s.blocks.splice(afterBlockId ? i + 1 : s.blocks.length, 0, block as Block);
        mergeStrings(doc, strings);
      }),
  );

  server.registerTool("remove_block", { title: "Remove a block", description: "Removes a block from the draft, then validates.", inputSchema: { lessonId: z.string(), blockId: z.string() } }, async ({ lessonId, blockId }) =>
    editLesson(lessonId, (doc) => {
      const before = doc.stages.reduce((n, s) => n + s.blocks.length, 0);
      for (const s of doc.stages) s.blocks = s.blocks.filter((b) => b.id !== blockId);
      if (doc.stages.reduce((n, s) => n + s.blocks.length, 0) === before) return `No block "${blockId}".`;
    }),
  );

  server.registerTool(
    "validate_lesson",
    { title: "Validate a lesson", description: "Runs the full validation service: schema, contracts and every pedagogy check. Pass a lessonId, or a document to check without saving.", inputSchema: { lessonId: z.string().optional(), doc: z.record(z.unknown()).optional() } },
    async ({ lessonId, doc }) => {
      const target = doc ?? (lessonId ? (await findLesson(lessonId))?.doc : undefined);
      return target ? json(await validateWithCms(payload, target)) : failure("Give a lessonId or a doc.");
    },
  );

  server.registerTool(
    "run_pipeline",
    { title: "Run the agent pipeline", description: "Hands a request (and optionally an existing draft) to the agent pipeline. Track it in the console's Pipeline module.", inputSchema: { request: z.string(), lessonId: z.string().optional() } },
    async ({ request, lessonId }) => {
      const lesson = lessonId ? await findLesson(lessonId) : null;
      if (lessonId && !lesson) return failure(`No lesson "${lessonId}".`);
      const run = await payload.create({ collection: "pipeline-runs", data: { title: request.slice(0, 80), request, lesson: lesson?.id as never, stage: "plan", status: "queued" }, ...as });
      return json({ queued: true, runId: run.id, console: `${process.env.APP_ORIGIN ?? ""}/console/collections/pipeline-runs/${run.id}` });
    },
  );

  server.registerTool(
    "get_preview_link",
    { title: "Get preview links", description: "Signed links (valid 72 hours) to the latest draft in personal and classroom modes, in every locale.", inputSchema: { lessonId: z.string() } },
    async ({ lessonId }) => {
      if (!(await findLesson(lessonId))) return failure(`No lesson "${lessonId}".`);
      const links: Record<string, Record<string, string>> = {};
      for (const locale of routing.locales) links[locale] = { personal: await previewUrl(lessonId, locale, "personal"), classroom: await previewUrl(lessonId, locale, "classroom") };
      return json(links);
    },
  );

  server.registerTool(
    "request_publish",
    { title: "Ask the creator to publish", description: "Puts the draft in the creator's decision queue. Nothing is published until the creator approves in the console with their passkey.", inputSchema: { lessonId: z.string(), note: z.string().describe("What changed, what reviewers flagged, and anything the creator should decide.") } },
    async ({ lessonId, note }) => {
      const l = await findLesson(lessonId);
      if (!l) return failure(`No lesson "${lessonId}".`);
      const v = l.validation as { passed?: boolean; errors?: number } | null;
      if (!v?.passed) return failure(`The draft has ${v?.errors ?? "unknown"} validation errors; fix them first (validate_lesson).`);
      const d = await payload.create({ collection: "decisions", data: { title: `Publish "${l.title}"`, kind: "publish", status: "open", summary: note, target: `lessons/${l.id}`, requestedBy: "mcp" }, ...as });
      return json({ queued: true, decisionId: d.id, message: "The creator will review it in the console. It is not published yet." });
    },
  );

  return server;
}
