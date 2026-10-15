import type { AuthStrategy } from "payload";
import { SESSION_COOKIE, readSession } from "./session";

function cookie(headers: Headers, name: string): string | undefined {
  const raw = headers.get("cookie") ?? "";
  for (const part of raw.split(/;\s*/)) {
    const i = part.indexOf("=");
    if (i > 0 && part.slice(0, i) === name) return decodeURIComponent(part.slice(i + 1));
  }
  return undefined;
}

/** Payload auth strategy: the creator is whoever holds a valid passkey session cookie. */
export const passkeyStrategy: AuthStrategy = {
  name: "passkey-session",
  authenticate: async ({ headers, payload }) => {
    const session = await readSession(cookie(headers, SESSION_COOKIE));
    if (!session) return { user: null };
    try {
      const user = await payload.findByID({ collection: "users", id: session.userId, depth: 0, overrideAccess: true });
      // The creator and the native-speaker reviewers they invited sign in; agents never do.
      if (!user || (user.role !== "creator" && user.role !== "reviewer")) return { user: null };
      return { user: { ...user, collection: "users", _strategy: "passkey-session", authTime: session.authTime } };
    } catch {
      return { user: null };
    }
  },
};
