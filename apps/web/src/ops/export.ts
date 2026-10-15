import { createHash } from "node:crypto";
import { existsSync } from "node:fs";
import { readFile, readdir, stat } from "node:fs/promises";
import path from "node:path";
import type { CollectionSlug, GlobalSlug, Payload } from "payload";
import { logEvent } from "@/cms/events";
import { ZipWriter } from "./zip";

/**
 * Full export (docs/03 "Reliability and ownership", docs/12): everything the
 * creator owns, in open formats (JSON, Markdown), so the platform could be
 * rebuilt elsewhere. Credentials and ephemeral learner activity are left out.
 */

/** Never exported: sign-in credentials, connector grants, live classroom activity. */
export const EXCLUDED_COLLECTIONS: Record<string, string> = {
  "oauth-grants": "token hashes (secret material)",
  "classroom-sessions": "ephemeral learner activity, purged after 30 days",
  "classroom-votes": "ephemeral learner activity, purged after 30 days",
};
/** Users are exported by allow-list: the passkey array, and anything Payload adds for auth, never leaves. */
const USER_FIELDS = ["id", "name", "email", "role", "agentId", "reviewerLocales", "createdAt", "updatedAt"];
const REPO_DIRS = ["platform", "docs", "schemas"];
const TEXT_EXT = new Set([".md", ".json", ".yaml", ".yml", ".txt", ".csv"]);
const PAGE = 500;
const PART = 2000;
const MAX_REPO_FILE = 2_000_000;

export interface ExportFile {
  path: string;
  data: Buffer;
}

const json = (v: unknown) => Buffer.from(`${JSON.stringify(v, null, 2)}\n`);

function repoRoot(): string | null {
  if (process.env.EXPORT_REPO_ROOT) return process.env.EXPORT_REPO_ROOT;
  let dir = process.cwd();
  for (let i = 0; i < 5; i++) {
    if (existsSync(path.join(dir, "platform")) && existsSync(path.join(dir, "docs"))) return dir;
    dir = path.dirname(dir);
  }
  return null;
}

async function* walk(dir: string): AsyncGenerator<string> {
  for (const e of (await readdir(dir, { withFileTypes: true })).sort((a, b) => a.name.localeCompare(b.name))) {
    if (e.name === "node_modules" || e.name.startsWith(".")) continue;
    const p = path.join(dir, e.name);
    if (e.isDirectory()) yield* walk(p);
    else if (e.isFile() && TEXT_EXT.has(path.extname(e.name).toLowerCase())) yield p;
  }
}

async function* pages(payload: Payload, collection: string, draft?: boolean): AsyncGenerator<Record<string, unknown>[]> {
  let page = 1;
  for (;;) {
    const r = await payload.find({ collection: collection as CollectionSlug, page, limit: PAGE, depth: 0, sort: "id", overrideAccess: true, ...(draft === undefined ? {} : { draft }) });
    if (r.docs.length) yield r.docs as unknown as Record<string, unknown>[];
    if (!r.hasNextPage) return;
    page++;
  }
}

async function* chunked(prefix: string, source: AsyncGenerator<Record<string, unknown>[]>, onCount: (n: number) => void, map: (d: Record<string, unknown>) => Record<string, unknown> = (d) => d): AsyncGenerator<ExportFile> {
  let buf: Record<string, unknown>[] = [];
  let part = 0;
  for await (const docs of source) {
    for (const d of docs) {
      buf.push(map(d));
      onCount(1);
      if (buf.length >= PART) {
        yield { path: `${prefix}-${String(++part).padStart(4, "0")}.json`, data: json(buf) };
        buf = [];
      }
    }
  }
  if (buf.length || part === 0) yield { path: `${prefix}-${String(++part).padStart(4, "0")}.json`, data: json(buf) };
}

/** Every file in the export, except the manifest, which describes them. */
export async function* exportFiles(payload: Payload, counts: Record<string, number>): AsyncGenerator<ExportFile> {
  const count = (k: string) => (n: number) => void (counts[k] = (counts[k] ?? 0) + n);
  for (const c of payload.config.collections) {
    const slug = c.slug;
    if (slug in EXCLUDED_COLLECTIONS) continue;
    const versioned = !!c.versions;
    const dir = `collections/${slug}`;
    if (slug === "users") {
      yield* chunked(`${dir}/latest`, pages(payload, slug), count(slug), (d) => Object.fromEntries(USER_FIELDS.filter((k) => k in d).map((k) => [k, d[k]])));
      continue;
    }
    // Drafts included: the newest saved state of every document, and (when drafts exist) what is live.
    yield* chunked(`${dir}/latest`, pages(payload, slug, versioned && c.versions && typeof c.versions === "object" && c.versions.drafts ? true : undefined), count(slug));
    if (versioned && typeof c.versions === "object" && c.versions.drafts) {
      yield* chunked(`${dir}/published`, pages(payload, slug, false), () => undefined);
      let page = 1;
      const versions: Record<string, unknown>[] = [];
      for (;;) {
        const r = await payload.findVersions({ collection: slug as CollectionSlug, page, limit: PAGE, depth: 0, overrideAccess: true });
        versions.push(...(r.docs as unknown as Record<string, unknown>[]));
        if (!r.hasNextPage) break;
        page++;
      }
      count(`${slug}.versions`)(versions.length);
      for (let i = 0; i < Math.max(1, Math.ceil(versions.length / PART)); i++) yield { path: `${dir}/versions-${String(i + 1).padStart(4, "0")}.json`, data: json(versions.slice(i * PART, (i + 1) * PART)) };
    }
  }
  for (const g of payload.config.globals) {
    const slug = g.slug as GlobalSlug;
    yield { path: `globals/${slug}.json`, data: json(await payload.findGlobal({ slug, depth: 0, overrideAccess: true })) };
    count("globals")(1);
    if (g.versions) {
      const v = await payload.findGlobalVersions({ slug, limit: 1000, depth: 0, overrideAccess: true });
      yield { path: `globals/${slug}.versions.json`, data: json(v.docs) };
    }
  }
  const root = repoRoot();
  for (const d of REPO_DIRS) {
    if (!root || !existsSync(path.join(root, d))) continue;
    for await (const file of walk(path.join(root, d))) {
      if ((await stat(file)).size > MAX_REPO_FILE) continue;
      yield { path: `repository/${path.relative(root, file).split(path.sep).join("/")}`, data: await readFile(file) };
      count("repository files")(1);
    }
  }
}

/** The zip, as a stream. Logs `export.created` once the manifest is written. */
export function exportStream(payload: Payload, req: Parameters<typeof logEvent>[1], now = new Date()): ReadableStream<Uint8Array> {
  const zip = new ZipWriter(now);
  const gen = (async function* () {
    const counts: Record<string, number> = {};
    const files: { path: string; bytes: number; sha256: string }[] = [];
    let total = 0;
    for await (const f of exportFiles(payload, counts)) {
      files.push({ path: f.path, bytes: f.data.length, sha256: createHash("sha256").update(f.data).digest("hex") });
      total += f.data.length;
      yield zip.file(f.path, f.data);
    }
    const manifest = {
      format: "learning-magazine-export/1",
      createdAt: now.toISOString(),
      counts,
      excluded: { ...EXCLUDED_COLLECTIONS, "users.passkeys": "sign-in credentials", "media files": "binary assets are not bundled; metadata (provenance, licence, captions) is included", "analytics-daily": "included as anonymous daily totals only" },
      files,
    };
    yield zip.file("manifest.json", json(manifest));
    await logEvent(payload, req, { action: "export.created", target: "export", data: { files: files.length + 1, bytes: total, counts } });
    yield zip.finish();
  })();
  return new ReadableStream<Uint8Array>({
    async pull(controller) {
      try {
        const n = await gen.next();
        if (n.done) controller.close();
        else controller.enqueue(n.value);
      } catch (e) {
        await logEvent(payload, req, { action: "export.failed", target: "export", reason: e instanceof Error ? e.message.slice(0, 200) : "error" }).catch(() => undefined);
        controller.error(e);
      }
    },
    cancel: () => void gen.return(undefined),
  });
}
