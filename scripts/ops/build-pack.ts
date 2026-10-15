/**
 * Builds an offline lesson pack (docs/03, docs/12): a zip a school unpacks on
 * one computer and runs with Node.js, with no internet and no database.
 *
 *   pnpm pack:lessons                         published lessons only
 *   pnpm pack:lessons --include every-primitive   add named lessons (testing; marks the pack "-test")
 *   options: --out <dir> (default dist/), --work <dir> (default: a temp dir), --keep-work,
 *            --reuse-work (build from the copy already in --work)
 *
 * How (decided 2026-10-15, see docs/DECISIONS.md):
 * 1. The repository's tracked and untracked-but-not-ignored files are copied
 *    to a work folder, so the build never touches apps/web/.next of a running
 *    dev server and never changes the working tree.
 * 2. In that copy, content/lessons and content/teacher-guides are pruned to
 *    the selected lessons, and every route that needs a database or the
 *    creator (the console, /api, /oauth, /.well-known) is removed: those
 *    URLs are plain 404s in a pack.
 * 3. `next build` runs with LM_PACK=1 (output: "standalone") and without
 *    DATABASE_URI, so content comes from /content and live voting and
 *    analytics are off.
 * 4. The standalone server, static assets, public files, content, launcher,
 *    README and manifest (sha256 of every file) are zipped to
 *    dist/<name>.zip, with <name>.zip.sha256 beside it.
 */
import { execFileSync } from "node:child_process";
import { chmodSync, copyFileSync, cpSync, existsSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { describeLesson, LAUNCHER, packName, parseArgs, readme, selectLessons, sha256, START_CMD, START_SH, type Manifest } from "./pack-lib";

const repo = path.resolve(import.meta.dirname, "../..");
/** Routes that need a database, a secret or the creator; they are not part of a pack. */
const EXCLUDED_ROUTES = ["apps/web/src/app/(payload)", "apps/web/src/app/api", "apps/web/src/app/oauth", "apps/web/src/app/.well-known"];

const log = (s: string) => console.log(`[pack] ${s}`);
const run = (cmd: string, args: string[], cwd: string, env: NodeJS.ProcessEnv = process.env) => execFileSync(cmd, args, { cwd, env, stdio: "inherit" });

function walk(dir: string, base = dir): string[] {
  const out: string[] = [];
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) out.push(...walk(p, base));
    else if (e.isFile()) out.push(path.relative(base, p).split(path.sep).join("/"));
  }
  return out.sort();
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  const lessonsDir = path.join(repo, "content/lessons");
  const all = readdirSync(lessonsDir)
    .filter((f) => f.endsWith(".json"))
    .map((f) => describeLesson(readFileSync(path.join(lessonsDir, f), "utf8")));
  const { lessons, unpublished } = selectLessons(all, args.include);
  if (!lessons.length) {
    console.error("[pack] No published lessons in content/lessons, so there is nothing to pack. Use --include <id> to build a test pack.");
    process.exit(1);
  }
  const test = unpublished.length > 0;
  if (test) log(`TEST PACK: includes unpublished lesson(s) ${unpublished.join(", ")}. Not for distribution.`);
  const name = packName(new Date(), test);
  const keep = new Set(lessons.map((l) => l.id));
  log(`lessons: ${[...keep].join(", ")}`);

  // 1. Copy the repository (tracked + untracked, minus .gitignore'd: no node_modules, .next or .env files).
  const work = args.work ? path.resolve(args.work) : mkdtempSync(path.join(os.tmpdir(), "lm-pack-"));
  const src = path.join(work, "repo");
  if (args.reuse && existsSync(src)) {
    log(`reusing ${src}`);
    // Restore the full content folder so a different --include still works, then prune again below.
    rmSync(path.join(src, "content"), { recursive: true, force: true });
    cpSync(path.join(repo, "content"), path.join(src, "content"), { recursive: true });
  } else {
    rmSync(src, { recursive: true, force: true });
    const listed = execFileSync("git", ["ls-files", "-z", "-co", "--exclude-standard"], { cwd: repo }).toString("utf8").split("\0").filter(Boolean);
    for (const f of listed) {
      const from = path.join(repo, f);
      if (!existsSync(from) || !statSync(from).isFile()) continue; // deleted in the working tree
      mkdirSync(path.dirname(path.join(src, f)), { recursive: true });
      copyFileSync(from, path.join(src, f));
    }
    log(`copied ${listed.length} files to ${src}`);
  }

  // 2. Prune content and routes.
  for (const f of readdirSync(path.join(src, "content/lessons"))) if (!keep.has(f.replace(/\.json$/, ""))) rmSync(path.join(src, "content/lessons", f));
  const guides = path.join(src, "content/teacher-guides");
  if (existsSync(guides)) for (const f of readdirSync(guides)) if (!keep.has(f.split(".")[0]!)) rmSync(path.join(guides, f));
  for (const r of EXCLUDED_ROUTES) rmSync(path.join(src, r), { recursive: true, force: true });

  // 3. Install and build without a database.
  // A flat (hoisted) node_modules: the standalone server then contains real files rather than pnpm's
  // symlinks, which a zip cannot carry to Windows. The lockfile is the same; only the layout differs.
  writeFileSync(path.join(src, ".npmrc"), `${existsSync(path.join(repo, ".npmrc")) ? readFileSync(path.join(repo, ".npmrc"), "utf8") : ""}\nnode-linker=hoisted\n`);
  run("pnpm", ["install", "--frozen-lockfile", "--prefer-offline"], src);
  const env: NodeJS.ProcessEnv = { ...process.env, LM_PACK: "1", NEXT_TELEMETRY_DISABLED: "1", NODE_ENV: "production" };
  for (const k of ["DATABASE_URI", "TEST_DATABASE_URI", "ANTHROPIC_API_KEY", "CRON_SECRET", "CREATOR_SETUP_TOKEN"]) delete env[k];
  run("pnpm", ["--filter", "@lm/web", "build"], src, env);

  // 4. Assemble.
  const web = path.join(src, "apps/web");
  const out = path.join(work, "out", name);
  rmSync(path.join(work, "out"), { recursive: true, force: true });
  const server = path.join(out, "server");
  // Symlinks (pnpm's node_modules layout) are copied as real files so the zip unpacks on Windows too.
  cpSync(path.join(web, ".next/standalone"), server, { recursive: true, dereference: true });
  cpSync(path.join(web, ".next/static"), path.join(server, "apps/web/.next/static"), { recursive: true });
  cpSync(path.join(web, "public"), path.join(server, "apps/web/public"), { recursive: true });
  rmSync(path.join(server, "content"), { recursive: true, force: true });
  cpSync(path.join(src, "content"), path.join(server, "content"), { recursive: true });
  for (const secret of [".env", ".env.local", ".env.production"]) rmSync(path.join(server, "apps/web", secret), { force: true });

  writeFileSync(path.join(out, "launch.cjs"), LAUNCHER);
  writeFileSync(path.join(out, "start.sh"), START_SH);
  chmodSync(path.join(out, "start.sh"), 0o755);
  writeFileSync(path.join(out, "start.cmd"), START_CMD);
  writeFileSync(path.join(out, "README.txt"), readme({ name, lessons, test }));

  let commit = "unknown";
  try {
    commit = execFileSync("git", ["rev-parse", "HEAD"], { cwd: repo }).toString().trim();
    if (execFileSync("git", ["status", "--porcelain"], { cwd: repo }).toString().trim()) commit += "+uncommitted";
  } catch {
    /* not a git checkout */
  }
  const files: Record<string, string> = {};
  for (const f of walk(out)) files[f] = sha256(readFileSync(path.join(out, f)));
  const manifest: Manifest = { name, builtAt: new Date().toISOString(), commit, test, node: ">=20.9 (22 LTS recommended)", lessons, files };
  writeFileSync(path.join(out, "manifest.json"), `${JSON.stringify(manifest, null, 2)}\n`);

  const dist = path.resolve(args.out ?? path.join(repo, "dist"));
  mkdirSync(dist, { recursive: true });
  const zip = path.join(dist, `${name}.zip`);
  rmSync(zip, { force: true });
  run("zip", ["-r", "-q", "-X", zip, name], path.join(work, "out"));
  const digest = sha256(readFileSync(zip));
  writeFileSync(`${zip}.sha256`, `${digest}  ${name}.zip\n`);
  log(`wrote ${zip} (${(statSync(zip).size / 1e6).toFixed(1)} MB, ${Object.keys(files).length} files, sha256 ${digest})`);

  if (!args.keep && !args.work) rmSync(work, { recursive: true, force: true });
  else log(`work folder kept at ${work}`);
}

main();
