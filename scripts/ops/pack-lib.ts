/**
 * Pure parts of the offline lesson pack build (scripts/ops/build-pack.ts):
 * which lessons go in, the manifest, and the files a school runs. Kept free
 * of side effects so they can be unit tested.
 */
import { createHash } from "node:crypto";

export interface LessonFile {
  id: string;
  version: number;
  status: string;
  locales: string[];
  localeStatus: Record<string, string>;
  sha256: string;
}

export function sha256(data: string | Buffer): string {
  return createHash("sha256").update(data).digest("hex");
}

/** Reads the fields the pack needs from a lesson JSON file's text. */
export function describeLesson(text: string): LessonFile {
  const d = JSON.parse(text) as { id: string; version: number; status: string; strings?: Record<string, unknown>; localeStatus?: Record<string, string> };
  return { id: d.id, version: d.version, status: d.status, locales: Object.keys(d.strings ?? {}).sort(), localeStatus: d.localeStatus ?? {}, sha256: sha256(text) };
}

export interface Selection {
  lessons: LessonFile[];
  /** Lessons included through --include although they are not published. */
  unpublished: string[];
}

/**
 * Published lessons by default. `include` adds named lessons whatever their
 * status (for testing); an unknown id is an error so a typo never ships an
 * incomplete pack silently.
 */
export function selectLessons(all: LessonFile[], include: string[] = []): Selection {
  const byId = new Map(all.map((l) => [l.id, l]));
  const unknown = include.filter((id) => !byId.has(id));
  if (unknown.length) throw new Error(`Unknown lesson id(s) in --include: ${unknown.join(", ")}`);
  const ids = new Set([...all.filter((l) => l.status === "published").map((l) => l.id), ...include]);
  const lessons = [...ids].sort().map((id) => byId.get(id)!);
  return { lessons, unpublished: lessons.filter((l) => l.status !== "published").map((l) => l.id) };
}

export interface PackArgs {
  include: string[];
  work?: string;
  out?: string;
  keep: boolean;
  /** Build from the copy already in --work instead of copying the repository again (for iterating on a pack build). */
  reuse: boolean;
}

export function parseArgs(argv: string[]): PackArgs {
  const out: PackArgs = { include: [], keep: false, reuse: false };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i]!;
    const value = () => {
      const v = a.includes("=") ? a.slice(a.indexOf("=") + 1) : argv[++i];
      if (!v) throw new Error(`${a} needs a value`);
      return v;
    };
    if (a === "--") continue;
    else if (a.startsWith("--include")) out.include.push(...value().split(",").map((s) => s.trim()).filter(Boolean));
    else if (a.startsWith("--work")) out.work = value();
    else if (a.startsWith("--out")) out.out = value();
    else if (a === "--keep-work") out.keep = true;
    else if (a === "--reuse-work") out.reuse = true;
    else throw new Error(`Unknown option ${a}. Usage: pnpm pack:lessons [--include id,id] [--out dir] [--work dir] [--keep-work] [--reuse-work]`);
  }
  if (out.reuse && !out.work) throw new Error("--reuse-work needs --work <dir>");
  return out;
}

export function packName(date: Date, test: boolean): string {
  return `lesson-pack-${date.toISOString().slice(0, 10)}${test ? "-test" : ""}`;
}

export interface Manifest {
  name: string;
  builtAt: string;
  commit: string;
  test: boolean;
  node: string;
  lessons: LessonFile[];
  /** sha256 of every file in the pack except this manifest, by path relative to the pack folder. */
  files: Record<string, string>;
}

/**
 * The launcher both start scripts run. It prints the addresses other devices
 * on the school network can open, then runs the Next.js server.
 */
export const LAUNCHER = `// Starts the lesson pack server. Run through start.sh or start.cmd.
const { spawn } = require("node:child_process");
const os = require("node:os");
const path = require("node:path");

const major = Number(process.versions.node.split(".")[0]);
if (major < 20) {
  console.error("This lesson pack needs Node.js 22 (LTS). You have " + process.version + ". See README.txt.");
  process.exit(1);
}
const port = process.env.PORT || "8080";
const lan = [];
for (const list of Object.values(os.networkInterfaces())) for (const a of list || []) if (a.family === "IPv4" && !a.internal) lan.push(a.address);

console.log("");
console.log("Lesson pack is starting. Keep this window open while you teach.");
console.log("On this computer, open:   http://localhost:" + port + "/");
for (const ip of lan) console.log("On other devices, open:   http://" + ip + ":" + port + "/");
if (!lan.length) console.log("(No network found: only this computer can open the lessons.)");
console.log("To stop, press Ctrl+C or close this window.");
console.log("");

const dir = path.join(__dirname, "server", "apps", "web");
const env = { ...process.env, PORT: port, HOSTNAME: process.env.LM_PACK_HOST || "0.0.0.0", NODE_ENV: "production", NEXT_TELEMETRY_DISABLED: "1" };
// Files-only mode: the pack never talks to a database, even if the computer has one.
delete env.DATABASE_URI;
const child = spawn(process.execPath, ["server.js"], { cwd: dir, env, stdio: "inherit" });
for (const sig of ["SIGINT", "SIGTERM"]) process.on(sig, () => child.kill(sig));
child.on("exit", (code) => process.exit(code ?? 0));
`;

export const START_SH = `#!/bin/sh
# Start the lesson pack (macOS, Linux). Usage: ./start.sh   (or PORT=9000 ./start.sh)
cd "$(dirname "$0")" || exit 1
if ! command -v node >/dev/null 2>&1; then
  echo "Node.js is not installed. Install Node.js 22 LTS (see README.txt), then run this again."
  exit 1
fi
exec node launch.cjs
`;

export const START_CMD = [
  "@echo off",
  "rem Start the lesson pack (Windows). Double-click this file.",
  'cd /d "%~dp0"',
  "where node >nul 2>nul",
  "if errorlevel 1 (",
  "  echo Node.js is not installed. Install Node.js 22 LTS (see README.txt), then run this again.",
  "  pause",
  "  exit /b 1",
  ")",
  "node launch.cjs",
  "pause",
  "",
].join("\r\n");

export function readme(m: Pick<Manifest, "name" | "lessons" | "test">): string {
  const lessonLines = m.lessons.map((l) => `  - ${l.id} (version ${l.version}; languages: ${l.locales.join(", ")})`).join("\n");
  const testNote = m.test
    ? `\nTEST PACK. This pack contains lessons that are not published yet. Do not give it to\nschools or learners.\n`
    : "";
  return `${m.name}
${"=".repeat(m.name.length)}
${testNote}
This folder lets a school run the lessons from one computer, with no internet.
Other devices on the same Wi-Fi or school network can open the lessons too.

Lessons in this pack:
${lessonLines}

WHAT YOU NEED
  - One computer (Windows, macOS or Linux) to act as the lesson server.
  - Node.js 22 LTS installed on that computer. Download the installer once, from
    https://nodejs.org/ (choose "LTS"), while you have internet, or copy the
    installer from a USB stick. After that, no internet is needed.
  - Optional: a Wi-Fi router or school network, so learners' devices can join.

HOW TO START
  Windows:        double-click start.cmd
  macOS / Linux:  open a terminal in this folder and run  ./start.sh
  The window shows the addresses to open, for example http://192.168.1.20:8080/
  Type that address into the browser on the projector computer or learners'
  devices. Keep the window open while you teach. Press Ctrl+C to stop.
  To use another port: PORT=9000 ./start.sh  (Windows: set PORT=9000 then start.cmd)

CLASSROOM MODE
  Each lesson has a classroom version for the projector (the "Classroom" link,
  or /en/lessons/<lesson>/classroom). In this pack, votes are counted by show of
  hands: the teacher asks the class and enters the counts. Live phone voting
  and class codes need the online platform and are not available here.
  Teacher guides and parent pages are at /en/lessons/<lesson>/teach and
  /en/lessons/<lesson>/parents.

PRIVACY
  The pack collects nothing. It has no accounts, no analytics and no database.
  Learners' progress stays in their own browser on their own device.

GOOD TO KNOW
  - If other devices cannot connect, allow Node.js through the computer's
    firewall when asked, and check that all devices are on the same network.
  - Learners' devices keep working only while this computer is running: the
    browser's offline mode needs a secure (https) site, which a school network
    address is not.
  - Languages: English (en), Hindi (hi) and Telugu (te). Change the language
    from the lesson page, or replace /en/ in the address with /hi/ or /te/.
  - manifest.json lists every file with its SHA-256 checksum.

हिन्दी (संक्षेप में)
  यह पैक बिना इंटरनेट के एक कंप्यूटर से पाठ चलाता है। कंप्यूटर पर Node.js 22 LTS
  (https://nodejs.org/) इंस्टॉल करें। Windows पर start.cmd पर डबल-क्लिक करें, macOS/Linux
  पर ./start.sh चलाएँ। खिड़की में दिखाया गया पता (जैसे http://192.168.1.20:8080/) उसी
  नेटवर्क के दूसरे उपकरणों के ब्राउज़र में खोलें। कक्षा मोड में वोट हाथ उठाकर गिने जाते हैं।
  यह पैक कोई जानकारी एकत्र नहीं करता।

తెలుగు (సంక్షిప్తంగా)
  ఈ ప్యాక్ ఇంటర్నెట్ లేకుండా ఒక కంప్యూటర్ నుండి పాఠాలను నడుపుతుంది. కంప్యూటర్‌లో
  Node.js 22 LTS (https://nodejs.org/) ఇన్‌స్టాల్ చేయండి. Windows లో start.cmd పై డబుల్-క్లిక్
  చేయండి, macOS/Linux లో ./start.sh నడపండి. విండోలో చూపిన చిరునామాను (ఉదా.
  http://192.168.1.20:8080/) అదే నెట్‌వర్క్‌లోని ఇతర పరికరాల బ్రౌజర్‌లో తెరవండి. తరగతి
  మోడ్‌లో ఓట్లను చేతులెత్తి లెక్కిస్తారు. ఈ ప్యాక్ ఎలాంటి సమాచారాన్నీ సేకరించదు.
  (Hindi and Telugu notes are drafts awaiting native-speaker review.)
`;
}
