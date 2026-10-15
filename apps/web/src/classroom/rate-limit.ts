/**
 * A small fixed-window limiter per client address, per server instance. It
 * blunts accidental floods (a stuck button, a script); it is not a security
 * boundary. The client address is used only in memory and never stored.
 */
const windows = new Map<string, { start: number; n: number }>();

export function rateLimited(req: Request, bucket: string, limit: number, windowSeconds: number, by?: string): boolean {
  // By default, per client address. Votes pass their own key: a whole class often shares one school address.
  const who = by ?? (req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || req.headers.get("x-real-ip") || "local");
  const key = `${bucket}:${who}`;
  const now = Date.now();
  const w = windows.get(key);
  if (!w || now - w.start > windowSeconds * 1000) {
    windows.set(key, { start: now, n: 1 });
    if (windows.size > 50_000) windows.clear();
    return false;
  }
  w.n++;
  return w.n > limit;
}
