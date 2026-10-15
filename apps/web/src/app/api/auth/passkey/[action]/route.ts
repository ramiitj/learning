import { timingSafeEqual } from "node:crypto";
import {
  generateAuthenticationOptions,
  generateRegistrationOptions,
  verifyAuthenticationResponse,
  verifyRegistrationResponse,
  type AuthenticatorTransportFuture,
} from "@simplewebauthn/server";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { getPayload } from "payload";
import config from "@payload-config";
import { logEvent } from "@/cms/events";
import { CHALLENGE_COOKIE, SESSION_COOKIE, cookieOptions, readChallenge, readInvite, readSession, relyingParty, signChallenge, signSession } from "@/auth/session";
import { OriginUnavailableError } from "@/auth/origin";
import { cleanName, isFresh, setupClosed } from "@/auth/passkeys";

export const dynamic = "force-dynamic";

type Passkey = { credentialId: string; publicKey: string; counter: number; transports?: AuthenticatorTransportFuture[]; label?: string; addedAt?: string; lastUsedAt?: string };
type Creator = { id: string | number; name: string; role?: string; passkeys?: Passkey[] };

const b64 = {
  enc: (u: Uint8Array) => Buffer.from(u).toString("base64url"),
  dec: (s: string) => new Uint8Array(Buffer.from(s, "base64url")),
};

const fail = (status: number, message: string) => NextResponse.json({ error: message }, { status });

function setupTokenOk(given: unknown): boolean {
  const expected = process.env.CREATOR_SETUP_TOKEN;
  if (!expected || typeof given !== "string" || given.length !== expected.length) return false;
  return timingSafeEqual(Buffer.from(given), Buffer.from(expected));
}

async function creator(payload: Awaited<ReturnType<typeof getPayload>>): Promise<Creator | null> {
  const { docs } = await payload.find({ collection: "users", where: { role: { equals: "creator" } }, limit: 1, overrideAccess: true, depth: 0, showHiddenFields: true });
  return (docs[0] as Creator | undefined) ?? null;
}

/**
 * Passkey ceremonies (decided 2026-10-15: passkeys only).
 *   register-options / register   the creator's first passkey (one-time setup token), another one (signed in,
 *                                 confirmed within five minutes), or an invited reviewer's passkey (invite link).
 *                                 Once a creator exists the setup token is refused for good, whatever the
 *                                 environment says, and each attempt is logged as auth.setup-refused.
 *   login-options / login         sign in with any registered passkey; also re-confirms before publishing
 *   logout
 */
export async function POST(req: Request, { params }: { params: Promise<{ action: string }> }) {
  const { action } = await params;
  const payload = await getPayload({ config });
  const jar = await cookies();
  let rp: ReturnType<typeof relyingParty>;
  try {
    rp = relyingParty();
  } catch (e) {
    // Production without APP_ORIGIN: refuse every ceremony rather than bind passkeys to the wrong origin.
    if (e instanceof OriginUnavailableError) return fail(503, e.message);
    throw e;
  }
  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const owner = await creator(payload);
  const session = await readSession(jar.get(SESSION_COOKIE)?.value);

  const invitedId = await readInvite(body.invite);
  const invited = invitedId ? ((await payload.findByID({ collection: "users", id: invitedId, overrideAccess: true, depth: 0, showHiddenFields: true }).catch(() => null)) as Creator | null) : null;

  const ownerSignedIn = !!owner && !!session && session.userId === String(owner.id);
  const isSetupAttempt = (action === "register-options" || action === "register") && body.setupToken !== undefined && !invited;
  if (isSetupAttempt && (owner || (await setupClosed(payload)))) {
    await logEvent(payload, undefined, { action: "auth.setup-refused", reason: "a creator account already exists; the setup token is closed for good", data: { step: action } });
    return fail(403, "Setup is closed: the creator account already exists. Sign in with your passkey.");
  }

  if (action === "register-options") {
    const firstKey = !owner && setupTokenOk(body.setupToken);
    const addingKey = ownerSignedIn && isFresh(session?.authTime);
    const reviewerKey = invited?.role === "reviewer";
    if (!firstKey && !addingKey && !reviewerKey) {
      if (ownerSignedIn) {
        await logEvent(payload, undefined, { action: "auth.passkey-add-refused", target: `users/${owner!.id}`, reason: "no passkey confirmation in the last five minutes" });
        return fail(403, "Adding a passkey needs a passkey confirmation from the last five minutes. Confirm, then try again.");
      }
      return fail(403, invitedId === null && body.invite ? "This invitation has expired." : owner ? "Sign in with your existing passkey first." : "The setup token is not right.");
    }
    const options = await generateRegistrationOptions({
      rpName: rp.rpName,
      rpID: rp.rpID,
      userName: String(invited?.name ?? body.name ?? owner?.name ?? "Creator"),
      attestationType: "none",
      authenticatorSelection: { residentKey: "required", userVerification: "required" },
      excludeCredentials: ((invited ?? owner)?.passkeys ?? []).map((p) => ({ id: p.credentialId, transports: p.transports })),
    });
    jar.set(CHALLENGE_COOKIE, await signChallenge(options.challenge, "register"), { ...cookieOptions(), maxAge: 300 });
    return NextResponse.json(options);
  }

  if (action === "register") {
    const challenge = await readChallenge(jar.get(CHALLENGE_COOKIE)?.value, "register");
    if (!challenge) return fail(400, "The request expired. Try again.");
    const firstKey = !owner && setupTokenOk(body.setupToken);
    // Adding another passkey needs the same fresh confirmation here as in register-options.
    const addingKey = ownerSignedIn && isFresh(session?.authTime);
    const reviewerKey = invited?.role === "reviewer";
    if (!firstKey && !addingKey && !reviewerKey) {
      if (ownerSignedIn) await logEvent(payload, undefined, { action: "auth.passkey-add-refused", target: `users/${owner!.id}`, reason: "no passkey confirmation in the last five minutes" });
      return fail(403, ownerSignedIn ? "Adding a passkey needs a passkey confirmation from the last five minutes. Confirm, then try again." : "Not allowed.");
    }
    const v = await verifyRegistrationResponse({ response: body.response as never, expectedChallenge: challenge, expectedOrigin: rp.origin, expectedRPID: rp.rpID, requireUserVerification: true });
    if (!v.verified || !v.registrationInfo) return fail(400, "The passkey could not be verified.");
    const { credential } = v.registrationInfo;
    const key: Passkey = { credentialId: credential.id, publicKey: b64.enc(credential.publicKey), counter: credential.counter, transports: credential.transports, label: cleanName(body.label) ?? "Passkey", addedAt: new Date().toISOString() };
    const holder = reviewerKey ? invited : owner;
    const user = holder
      ? await payload.update({ collection: "users", id: holder.id, data: { passkeys: [...(holder.passkeys ?? []), key] } as never, overrideAccess: true, context: { system: true } })
      : await payload.create({ collection: "users", data: { name: String(body.name ?? "Creator"), role: "creator", passkeys: [key] } as never, overrideAccess: true, context: { system: true } });
    await logEvent(payload, undefined, { action: reviewerKey ? "auth.reviewer-joined" : owner ? "auth.passkey-added" : "auth.creator-created", target: `users/${user.id}`, data: { name: key.label } });
    jar.delete(CHALLENGE_COOKIE);
    // Adding a key keeps the existing session's confirmation time; a new account or reviewer starts a fresh session.
    jar.set(SESSION_COOKIE, await signSession(user.id, addingKey && session ? session.authTime : undefined), cookieOptions());
    return NextResponse.json({ ok: true });
  }

  if (action === "login-options") {
    if (!owner) return fail(404, "No creator account yet. Use the setup token to create one.");
    // Discoverable credentials: the browser offers whichever passkey this person has; the server then finds whose it is.
    const options = await generateAuthenticationOptions({ rpID: rp.rpID, userVerification: "required" });
    jar.set(CHALLENGE_COOKIE, await signChallenge(options.challenge, "login"), { ...cookieOptions(), maxAge: 300 });
    return NextResponse.json(options);
  }

  if (action === "login") {
    const challenge = await readChallenge(jar.get(CHALLENGE_COOKIE)?.value, "login");
    if (!challenge) return fail(400, "The request expired. Try again.");
    const response = body.response as { id?: string };
    const found = await payload.find({ collection: "users", where: { and: [{ "passkeys.credentialId": { equals: String(response?.id ?? "") } }, { role: { in: ["creator", "reviewer"] } }] }, limit: 1, overrideAccess: true, depth: 0, showHiddenFields: true });
    const person = found.docs[0] as Creator | undefined;
    const key = (person?.passkeys ?? []).find((p) => p.credentialId === response?.id);
    if (!person || !key) return fail(403, "This passkey is not registered.");
    const v = await verifyAuthenticationResponse({
      response: body.response as never,
      expectedChallenge: challenge,
      expectedOrigin: rp.origin,
      expectedRPID: rp.rpID,
      requireUserVerification: true,
      credential: { id: key.credentialId, publicKey: b64.dec(key.publicKey), counter: key.counter, transports: key.transports },
    });
    if (!v.verified) {
      await logEvent(payload, undefined, { action: "auth.sign-in-failed", target: `users/${person.id}` });
      return fail(403, "The passkey could not be verified.");
    }
    const passkeys = (person.passkeys ?? []).map((p) => (p.credentialId === key.credentialId ? { ...p, counter: v.authenticationInfo.newCounter, lastUsedAt: new Date().toISOString() } : p));
    await payload.update({ collection: "users", id: person.id, data: { passkeys } as never, overrideAccess: true, context: { system: true } });
    await logEvent(payload, undefined, { action: session ? "auth.reconfirmed" : "auth.signed-in", target: `users/${person.id}` });
    jar.delete(CHALLENGE_COOKIE);
    jar.set(SESSION_COOKIE, await signSession(person.id), cookieOptions());
    return NextResponse.json({ ok: true });
  }

  if (action === "logout") {
    jar.delete(SESSION_COOKIE);
    return NextResponse.json({ ok: true });
  }

  return fail(404, "Unknown action");
}
