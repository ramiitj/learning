import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { issueCode, readClient } from "@/auth/oauth";
import { SESSION_COOKIE, readSession } from "@/auth/session";
import { cmsClient } from "@/cms/client";
import { logEvent } from "@/cms/events";
import { SignInHere } from "./SignInHere";

export const dynamic = "force-dynamic";

type Search = Promise<Record<string, string | undefined>>;

async function creatorSession() {
  const s = await readSession((await cookies()).get(SESSION_COOKIE)?.value);
  if (!s) return null;
  const payload = await cmsClient();
  const user = await payload.findByID({ collection: "users", id: s.userId, overrideAccess: true, depth: 0 }).catch(() => null);
  return user?.role === "creator" ? { user, authTime: s.authTime } : null;
}

/**
 * Consent for the MCP connector. A client gets a token only after the
 * creator, signed in with their passkey, approves it here. The token lets it
 * author drafts; it can never publish.
 */
export default async function Authorize({ searchParams }: { searchParams: Search }) {
  const q = await searchParams;
  const client = await readClient(q.client_id ?? null);
  const problem =
    !client ? "This app is not registered." : !q.redirect_uri || !client.redirect_uris.includes(q.redirect_uri) ? "The return address does not match the app's registration." : q.response_type !== "code" ? "Unsupported request." : q.code_challenge_method !== "S256" || !q.code_challenge ? "The app must use PKCE (S256)." : null;
  if (problem) return <p role="alert">{problem}</p>;

  const session = await creatorSession();
  if (!session) {
    return (
      <>
        <h1>Sign in to connect {client!.client_name}</h1>
        <p>Only the creator can connect apps to the authoring connector.</p>
        <SignInHere />
      </>
    );
  }

  async function decide(formData: FormData) {
    "use server";
    const s = await creatorSession();
    if (!s) redirect("/console/login");
    const target = new URL(q.redirect_uri!);
    if (q.state) target.searchParams.set("state", q.state);
    const payload = await cmsClient();
    if (formData.get("decision") !== "approve") {
      target.searchParams.set("error", "access_denied");
      await logEvent(payload, undefined, { action: "mcp.connection-denied", target: `oauth/${client!.client_name}` });
      redirect(target.toString());
    }
    target.searchParams.set("code", await issueCode({ clientId: q.client_id!, redirectUri: q.redirect_uri!, codeChallenge: q.code_challenge!, userId: String(s.user.id), scope: "author" }));
    await logEvent(payload, undefined, { action: "mcp.connection-approved", target: `oauth/${client!.client_name}`, data: { redirect: new URL(q.redirect_uri!).origin } });
    redirect(target.toString());
  }

  return (
    <>
      <h1>Connect {client!.client_name}?</h1>
      <p>
        It will be able to read lessons, the glossary, the analogy bank and the concept graph; create and edit <strong>drafts</strong>; run validation and the agent pipeline;
        make preview links; and ask you to publish. It can never publish, delete or change settings.
      </p>
      <p>It will return to <code>{new URL(q.redirect_uri!).origin}</code>. You can disconnect it at any time in the console under Access.</p>
      <form action={decide} style={{ display: "flex", gap: 12 }}>
        <button name="decision" value="approve" type="submit" style={{ padding: "10px 16px" }}>
          Connect
        </button>
        <button name="decision" value="deny" type="submit" style={{ padding: "10px 16px" }}>
          Cancel
        </button>
      </form>
    </>
  );
}
