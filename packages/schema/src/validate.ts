import Ajv2020, { type ErrorObject } from "ajv/dist/2020.js";
import lessonSchema from "../../../schemas/lesson.schema.json" with { type: "json" };
import { allBlocks, type ComponentContract, type Lesson } from "./index";

export type Severity = "error" | "warning";
export interface Issue {
  severity: Severity;
  path: string;
  message: string;
  check: "structure" | "component" | "config" | "strings" | "references";
}

export interface ValidateOptions {
  contracts: readonly ComponentContract[];
  /** Locales being checked for completeness. Defaults to every locale not marked "missing". */
  locales?: string[];
  /** Glossary term ids known for this lesson's subject. When given, block glossaryTerms are checked. */
  glossaryTerms?: ReadonlySet<string>;
}

const ajv = new Ajv2020({ allErrors: true, strict: false });
const validateStructure = ajv.compile<Lesson>(lessonSchema);
const configValidators = new Map<object, ReturnType<typeof ajv.compile>>();

function fmt(errors: ErrorObject[] | null | undefined, prefix = ""): { path: string; message: string }[] {
  return (errors ?? []).map((e) => ({ path: `${prefix}${e.instancePath || "/"}`, message: `${e.message ?? "invalid"}${e.params && "additionalProperty" in e.params ? ` (${String(e.params.additionalProperty)})` : ""}` }));
}

/**
 * Structural validation of a lesson: the lesson schema, each block's component
 * contract, block references and locale completeness. Pedagogy checks from
 * docs/04 are layered on top of this by the validation service (Phase 3).
 */
export function validateLesson(doc: unknown, opts: ValidateOptions): Issue[] {
  const issues: Issue[] = [];
  if (!validateStructure(doc)) {
    for (const e of fmt(validateStructure.errors)) issues.push({ severity: "error", check: "structure", ...e });
    return issues;
  }
  const lesson = doc;
  const byType = new Map(opts.contracts.map((c) => [c.type, c]));
  const blockIds = new Set<string>();
  const used = new Set<string>([lesson.meta.titleKey, ...lesson.meta.objectives.map((o) => o.textKey)]);
  if (lesson.meta.subtitleKey) used.add(lesson.meta.subtitleKey);
  for (const c of [...lesson.checks.pre, ...lesson.checks.post]) {
    used.add(c.promptKey);
    c.options.forEach((o) => used.add(o));
    if (c.feedbackKey) used.add(c.feedbackKey);
    if (!c.options.includes(c.answer)) issues.push({ severity: "error", check: "references", path: `/checks/${c.id}`, message: `answer "${c.answer}" is not one of the options` });
  }
  const objectiveIds = new Set(lesson.meta.objectives.map((o) => o.id));
  for (const c of [...lesson.checks.pre, ...lesson.checks.post]) {
    if (!objectiveIds.has(c.objective)) issues.push({ severity: "error", check: "references", path: `/checks/${c.id}`, message: `objective "${c.objective}" is not declared in meta.objectives` });
  }

  const refs: { from: string; to: string }[] = [];
  for (const { block } of allBlocks(lesson)) {
    const path = `/blocks/${block.id}`;
    if (blockIds.has(block.id)) issues.push({ severity: "error", check: "structure", path, message: "duplicate block id" });
    blockIds.add(block.id);
    const contract = byType.get(block.type);
    if (!contract) {
      issues.push({ severity: "error", check: "component", path, message: `component "${block.type}" is not registered` });
      continue;
    }
    if (!contract.versions.includes(block.componentVersion)) {
      issues.push({ severity: "error", check: "component", path, message: `"${block.type}" has no renderer for version ${block.componentVersion} (known: ${contract.versions.join(", ")})` });
    }
    let v = configValidators.get(contract.configSchema);
    if (!v) configValidators.set(contract.configSchema, (v = ajv.compile(contract.configSchema)));
    if (!v(block.config)) {
      for (const e of fmt(v.errors, `${path}/config`)) issues.push({ severity: "error", check: "config", ...e });
      continue;
    }
    contract.stringKeys(block.config).forEach((k) => used.add(k));
    for (const to of contract.blockRefs?.(block.config) ?? []) refs.push({ from: block.id, to });
    if (opts.glossaryTerms) {
      for (const g of block.glossaryTerms ?? []) {
        if (!opts.glossaryTerms.has(g)) issues.push({ severity: "error", check: "references", path, message: `glossary term "${g}" is not in the glossary` });
      }
    }
  }
  const order = [...allBlocks(lesson)].map((b) => b.block.id);
  for (const { from, to } of refs) {
    if (!blockIds.has(to)) issues.push({ severity: "error", check: "references", path: `/blocks/${from}`, message: `refers to unknown block "${to}"` });
    else if (order.indexOf(to) > order.indexOf(from)) issues.push({ severity: "warning", check: "references", path: `/blocks/${from}`, message: `refers to later block "${to}"` });
  }

  const locales = opts.locales ?? Object.entries(lesson.localeStatus).filter(([, s]) => s !== "missing").map(([l]) => l);
  for (const locale of locales) {
    const table = lesson.strings[locale] ?? {};
    const missing = [...used].filter((k) => !(k in table));
    if (missing.length) {
      issues.push({ severity: locale === "en" ? "error" : "warning", check: "strings", path: `/strings/${locale}`, message: `${missing.length} missing: ${missing.slice(0, 8).join(", ")}${missing.length > 8 ? ", …" : ""}` });
    }
  }
  return issues;
}

export const hasErrors = (issues: Issue[]) => issues.some((i) => i.severity === "error");
