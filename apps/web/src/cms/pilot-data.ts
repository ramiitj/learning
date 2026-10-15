import type { Payload } from "payload";
import { buildReport, type Finding, type LessonInfo, type OpenIncident, type OpenReport, type PilotReport, type Row } from "./pilot";

const DAY = /^\d{4}-\d{2}-\d{2}$/;

/** A valid date range, defaulting to the last 30 days. */
export function rangeOf(from?: unknown, to?: unknown): { from: string; to: string } {
  const t = typeof to === "string" && DAY.test(to) ? to : new Date().toISOString().slice(0, 10);
  const f = typeof from === "string" && DAY.test(from) ? from : new Date(Date.parse(t) - 30 * 86400_000).toISOString().slice(0, 10);
  return f <= t ? { from: f, to: t } : { from: t, to: f };
}

/** Gathers everything the pilot report needs. Reads only; the caller has already checked it is the creator. */
export async function loadPilotReport(payload: Payload, range: { from: string; to: string }, now = new Date()): Promise<PilotReport> {
  const o = { overrideAccess: true, depth: 0, pagination: false } as const;
  const [lessons, rows, findings, reports, incidents] = await Promise.all([
    payload.find({ collection: "lessons", limit: 500, ...o }),
    payload.find({ collection: "analytics-daily", where: { and: [{ day: { greater_than_equal: range.from } }, { day: { less_than_equal: range.to } }] }, limit: 100_000, ...o }),
    payload.find({ collection: "usability-findings", limit: 5000, ...o }),
    payload.find({ collection: "feedback", where: { status: { in: ["new", "triaged"] } }, limit: 500, ...o }),
    payload.find({ collection: "incidents", where: { status: { not_equals: "closed" } }, limit: 500, ...o }),
  ]);
  return buildReport({
    ...range,
    now,
    locales: ["en", "hi", "te"],
    lessons: lessons.docs.map((l) => ({ lessonId: l.lessonId, title: l.title ?? l.lessonId, doc: l.doc as LessonInfo["doc"] })),
    rows: rows.docs as unknown as Row[],
    findings: findings.docs.map((f) => ({ id: f.id, lesson: f.lesson, locale: f.locale, mode: f.mode, observed: f.observed, severity: f.severity, source: f.source, suggestedChange: f.suggestedChange, status: f.status })) as Finding[],
    reports: reports.docs.map((f) => ({ id: f.id, summary: f.summary ?? f.message.slice(0, 80), lessonId: f.lessonId, locale: f.locale, status: f.status ?? "new" })) as OpenReport[],
    incidents: incidents.docs.map((i) => ({ id: i.id, title: i.title, severity: i.severity, status: i.status })) as OpenIncident[],
  });
}
