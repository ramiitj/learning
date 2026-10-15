import type { Payload, PayloadRequest } from "payload";
import type { PipelineStore, Run } from "@lm/orchestrator";
import type { Lesson } from "@lm/schema";
import { previewUrl } from "@/auth/session";
import { routing } from "@/i18n/routing";
import { logEvent } from "@/cms/events";
import { cmsGlossary, validateWithCms } from "@/cms/validation";

type AgentUser = { id: number; role: "agent"; agentId: string; collection: "users" };

/**
 * The orchestrator's storage, backed by the CMS. Every write is made as the
 * agent doing the work, with access control on, so the platform's
 * permissions apply to agents exactly as they would to anyone else.
 */
export function cmsPipelineStore(payload: Payload, runDocId: number): PipelineStore {
  const users = new Map<string, AgentUser>();
  const as = async (agentId: string): Promise<AgentUser> => {
    const cached = users.get(agentId);
    if (cached) return cached;
    const { docs } = await payload.find({ collection: "users", where: { and: [{ role: { equals: "agent" } }, { agentId: { equals: agentId } }] }, limit: 1, overrideAccess: true, depth: 0 });
    if (!docs[0]) throw new Error(`No user for agent "${agentId}". Run cms:import.`);
    const u = { ...(docs[0] as unknown as AgentUser), collection: "users" as const };
    users.set(agentId, u);
    return u;
  };
  const reqAs = async (agentId: string) => ({ payload, user: await as(agentId), context: {} }) as unknown as PayloadRequest;
  const lessonDoc = async (lessonId: string) => (await payload.find({ collection: "lessons", where: { lessonId: { equals: lessonId } }, limit: 1, draft: true, overrideAccess: true, depth: 0 })).docs[0];

  return {
    async saveRun(run: Run, currentAgent) {
      const lesson = run.lessonId ? await lessonDoc(run.lessonId) : undefined;
      await payload.update({
        collection: "pipeline-runs",
        id: runDocId,
        overrideAccess: true,
        context: { system: true },
        data: { stage: run.stage, status: run.status, costUsd: Math.round(run.costUsd * 10000) / 10000, steps: run.steps as never, flags: run.flags as never, currentAgent: currentAgent ?? "", lessonSlug: run.lessonId ?? undefined, lesson: lesson?.id },
      });
    },
    async getLesson(lessonId) {
      return ((await lessonDoc(lessonId))?.doc as unknown as Lesson | undefined) ?? null;
    },
    async saveLessonDraft(doc, agent, reason) {
      const user = await as(agent);
      const existing = await lessonDoc(doc.id);
      const opts = { user: user as never, overrideAccess: false, draft: true, context: { reason } } as const;
      const saved = existing
        ? await payload.update({ collection: "lessons", id: existing.id, data: { doc: doc as never, _status: "draft" }, ...opts })
        : await payload.create({ collection: "lessons", data: { lessonId: doc.id, doc: doc as never, _status: "draft" }, ...opts });
      return saved.validation as never;
    },
    validate: (doc) => validateWithCms(payload, doc),
    async saveTeacherGuide(lessonId, locale, guide, agent) {
      const user = await as(agent);
      const { docs } = await payload.find({ collection: "teacher-guides", where: { and: [{ lessonId: { equals: lessonId } }, { locale: { equals: locale } }] }, limit: 1, draft: true, overrideAccess: true });
      const opts = { user: user as never, overrideAccess: false, draft: true } as const;
      if (docs[0]) await payload.update({ collection: "teacher-guides", id: docs[0].id, data: { guide: guide as never, _status: "draft" }, ...opts });
      else await payload.create({ collection: "teacher-guides", data: { lessonId, locale: locale as "en", guide: guide as never, _status: "draft" }, ...opts });
    },
    async createDecision(d, agent) {
      const created = await payload.create({ collection: "decisions", data: { ...d, kind: d.kind as "other", status: "open", positions: d.positions as never, options: d.options as never, requestedBy: agent }, user: (await as(agent)) as never, overrideAccess: false });
      return created.id;
    },
    async previewLinks(lessonId) {
      const out: Record<string, { personal: string; classroom: string }> = {};
      for (const l of routing.locales) out[l] = { personal: await previewUrl(lessonId, l, "personal"), classroom: await previewUrl(lessonId, l, "classroom") };
      return out;
    },
    async logEvent(action, agent, target, data) {
      await logEvent(payload, await reqAs(agent), { action, target, data });
    },
    async agentEnabled(agent) {
      const { docs } = await payload.find({ collection: "agents", where: { agentId: { equals: agent } }, limit: 1, overrideAccess: true, depth: 0 });
      return docs[0]?.enabled !== false;
    },
    async addAgentCost(agent, usd) {
      const { docs } = await payload.find({ collection: "agents", where: { agentId: { equals: agent } }, limit: 1, overrideAccess: true, depth: 0 });
      if (docs[0]) await payload.update({ collection: "agents", id: docs[0].id, data: { costUsd: (docs[0].costUsd ?? 0) + usd }, overrideAccess: true, context: { system: true } });
    },
    async budget() {
      const g = await payload.findGlobal({ slug: "budget", overrideAccess: true });
      const start = new Date();
      start.setUTCDate(1);
      start.setUTCHours(0, 0, 0, 0);
      const { docs } = await payload.find({ collection: "pipeline-runs", where: { createdAt: { greater_than_equal: start.toISOString() } }, limit: 10_000, overrideAccess: true, depth: 0, select: { costUsd: true } });
      return { spentUsd: docs.reduce((n, r) => n + (r.costUsd ?? 0), 0), limitUsd: g.monthlyLimitUsd ?? 0, alertAt: g.alertAt ?? 0.8 };
    },
    glossary: () => cmsGlossary(payload),
    async audience(id) {
      const { docs } = await payload.find({ collection: "audiences", where: { audienceId: { equals: id } }, limit: 1, overrideAccess: true });
      return docs[0]?.profile ?? null;
    },
  };
}

/** Loads a run document into the orchestrator's shape. */
export function runFromDoc(doc: { id: number; request: string; stage: string; status: string; costUsd?: number | null; steps?: unknown; flags?: unknown; lessonSlug?: string | null; urgent?: boolean | null }): Run {
  return {
    id: doc.id,
    request: doc.request,
    lessonId: doc.lessonSlug ?? null,
    stage: doc.stage as Run["stage"],
    status: doc.status as Run["status"],
    costUsd: doc.costUsd ?? 0,
    steps: (doc.steps as Run["steps"]) ?? [],
    flags: (doc.flags as Run["flags"]) ?? { open: [], resolved: [] },
    urgent: !!doc.urgent,
  };
}
