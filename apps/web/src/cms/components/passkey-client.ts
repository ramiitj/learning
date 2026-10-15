"use client";
import { startAuthentication, startRegistration } from "@simplewebauthn/browser";

async function post(action: string, body: unknown = {}) {
  const res = await fetch(`/api/auth/passkey/${action}`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body), credentials: "same-origin" });
  const data = (await res.json().catch(() => ({}))) as Record<string, unknown>;
  if (!res.ok) throw new Error(String(data.error ?? "Something went wrong"));
  return data;
}

export async function signInWithPasskey() {
  const options = await post("login-options");
  const response = await startAuthentication({ optionsJSON: options as never });
  await post("login", { response });
}

export async function registerPasskey(extra: { name?: string; setupToken?: string; label?: string }) {
  const options = await post("register-options", extra);
  const response = await startRegistration({ optionsJSON: options as never });
  await post("register", { ...extra, response });
}

export const signOut = () => post("logout");
