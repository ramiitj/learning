import { randomUUID } from "node:crypto";

/**
 * xAPI 1.0.3 statements from a launched lesson's anonymous learning moments
 * (docs/proposals/lti-xapi.md). The actor is always an anonymous account:
 * the site's origin and a random id made for one launch. No name, email,
 * LMS user id or other identifier ever appears, because none is ever known.
 */

/** The subset of the engine's LessonEvent stream (packages/engine/src/analytics.ts) that becomes statements, plus completion. */
export type XapiEvent =
  | { type: "start" }
  | { type: "act"; blockId: string }
  | { type: "answer"; blockId: string; choice: string; correct?: boolean }
  | { type: "post-check"; itemId: string; correct: boolean }
  | { type: "detour"; detourId: string }
  | { type: "complete" };

/** The same shape analytics accepts for keys: short ids from the lesson, never free text a learner typed. */
const ID = /^[\w.:-]{1,120}$/;
const id = (v: unknown) => (typeof v === "string" && ID.test(v) ? v : null);
export const MAX_EVENTS = 100;

/** Rebuilds each event from allowed fields only; anything else in the input (or any malformed event) is dropped. */
export function sanitiseEvents(raw: unknown): XapiEvent[] {
  if (!Array.isArray(raw)) return [];
  const out: XapiEvent[] = [];
  for (const e of raw.slice(0, MAX_EVENTS)) {
    if (!e || typeof e !== "object") continue;
    const r = e as Record<string, unknown>;
    switch (r.type) {
      case "start":
      case "complete":
        out.push({ type: r.type });
        break;
      case "act": {
        const blockId = id(r.blockId);
        if (blockId) out.push({ type: "act", blockId });
        break;
      }
      case "answer": {
        const blockId = id(r.blockId);
        const choice = id(r.choice);
        if (blockId && choice) out.push({ type: "answer", blockId, choice, ...(typeof r.correct === "boolean" ? { correct: r.correct } : {}) });
        break;
      }
      case "post-check": {
        const itemId = id(r.itemId);
        if (itemId && typeof r.correct === "boolean") out.push({ type: "post-check", itemId, correct: r.correct });
        break;
      }
      case "detour": {
        const detourId = id(r.detourId);
        if (detourId) out.push({ type: "detour", detourId });
        break;
      }
    }
  }
  return out;
}

export const VERB = {
  launched: "http://adlnet.gov/expapi/verbs/launched",
  progressed: "http://adlnet.gov/expapi/verbs/progressed",
  answered: "http://adlnet.gov/expapi/verbs/answered",
  completed: "http://adlnet.gov/expapi/verbs/completed",
} as const;
type VerbName = keyof typeof VERB;

const ACTIVITY = {
  lesson: "http://adlnet.gov/expapi/activities/lesson",
  interaction: "http://adlnet.gov/expapi/activities/cmi.interaction",
  question: "http://adlnet.gov/expapi/activities/question",
  module: "http://adlnet.gov/expapi/activities/module",
};

export interface Activity {
  objectType: "Activity";
  id: string;
  definition: { type: string };
}
export interface Statement {
  id: string;
  actor: { objectType: "Agent"; account: { homePage: string; name: string } };
  verb: { id: string; display: { "en-US": VerbName } };
  object: Activity;
  result?: { success?: boolean; response?: string; completion?: boolean };
  context: { language: string; contextActivities?: { parent: Activity[] }; extensions: Record<string, string> };
}

export interface StatementContext {
  origin: string;
  sessionId: string;
  lessonId: string;
  locale: string;
  mode: "personal" | "classroom";
}

/** A random (version 4) UUID, as crypto.randomUUID() makes. */
export const ANON_ID = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;

/**
 * One statement per event. There is deliberately no timestamp (the LRS
 * records when it stored each one) and no registration, so statements carry
 * nothing beyond what the learner did in this one launch.
 */
export function toStatements(events: XapiEvent[], c: StatementContext): Statement[] {
  if (!ANON_ID.test(c.sessionId)) throw new Error("the xAPI actor must be a random UUID");
  const lessonUrl = `${c.origin}/lessons/${c.lessonId}`;
  const lesson: Activity = { objectType: "Activity", id: lessonUrl, definition: { type: ACTIVITY.lesson } };
  const activity = (path: string, type: string): Activity => ({ objectType: "Activity", id: `${lessonUrl}/${path}`, definition: { type } });
  const make = (verb: VerbName, object: Activity, result?: Statement["result"]): Statement => ({
    id: randomUUID(),
    actor: { objectType: "Agent", account: { homePage: c.origin, name: c.sessionId } },
    verb: { id: VERB[verb], display: { "en-US": verb } },
    object,
    ...(result ? { result } : {}),
    context: {
      language: c.locale,
      ...(object === lesson ? {} : { contextActivities: { parent: [lesson] } }),
      extensions: { [`${c.origin}/xapi/extensions/mode`]: c.mode },
    },
  });
  return events.map((e) => {
    switch (e.type) {
      case "start":
        return make("launched", lesson);
      case "act":
        return make("progressed", activity(`blocks/${e.blockId}`, ACTIVITY.interaction));
      case "answer":
        return make("answered", activity(`blocks/${e.blockId}`, ACTIVITY.interaction), { response: e.choice, ...(e.correct === undefined ? {} : { success: e.correct }) });
      case "post-check":
        return make("answered", activity(`checks/${e.itemId}`, ACTIVITY.question), { success: e.correct });
      case "detour":
        return make("progressed", activity(`detours/${e.detourId}`, ACTIVITY.module));
      case "complete":
        return make("completed", lesson, { completion: true });
    }
  });
}

export interface Lrs {
  endpoint: string;
  key: string;
  secret: string;
}

/**
 * Sends one batch to the platform's LRS. A failure is retried once, then the
 * batch is dropped: the learner is never kept waiting and nothing is queued
 * on the server.
 */
export async function sendStatements(lrs: Lrs, statements: Statement[], fetchImpl: typeof fetch = fetch, timeoutMs = 5000): Promise<boolean> {
  if (!statements.length) return true;
  const url = `${lrs.endpoint.replace(/\/?$/, "/")}statements`;
  const init = (): RequestInit => ({
    method: "POST",
    headers: {
      authorization: `Basic ${Buffer.from(`${lrs.key}:${lrs.secret}`).toString("base64")}`,
      "x-experience-api-version": "1.0.3",
      "content-type": "application/json",
    },
    body: JSON.stringify(statements),
    signal: AbortSignal.timeout(timeoutMs),
    redirect: "error",
  });
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const res = await fetchImpl(url, init());
      if (res.ok) return true;
    } catch {
      // Network error or timeout: retry once, then drop.
    }
  }
  return false;
}
