/**
 * Error text is scrubbed before it leaves the browser and again before it is
 * stored: no emails, no numbers (ids, phone numbers, line numbers), no query
 * strings or fragments, no long tokens. Messages can echo user input, so they
 * are truncated hard. Shared by the client reporter and the server.
 */
export const MAX_MESSAGE = 200;
export const MAX_STACK = 600;

export function scrubText(input: unknown, max = MAX_MESSAGE): string {
  return String(input ?? "")
    .replace(/[\w.+-]+@[\w-]+(?:\.[\w-]+)+/g, "[email]")
    .replace(/\b(https?:\/\/[^\s?#)]*)[?#][^\s)]*/g, "$1")
    .replace(/([\w/.-])[?#][^\s)]*/g, "$1")
    .replace(/\b[A-Za-z0-9_-]{32,}\b/g, "[token]")
    .replace(/\d+/g, "#")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, max);
}

/** A stack reduced to its first few frames, scrubbed, one per line. */
export function scrubStack(stack: unknown): string {
  return String(stack ?? "")
    .split("\n")
    .slice(0, 6)
    .map((l) => scrubText(l, 160))
    .join("\n")
    .slice(0, MAX_STACK);
}

/** A route as a pathname only: never a query string or fragment. */
export function scrubRoute(route: unknown): string {
  return String(route ?? "").split(/[?#]/)[0]!.replace(/\d{3,}/g, "#").slice(0, 120);
}
