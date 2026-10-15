"use client";
import { useState } from "react";
import type { PasskeySummary } from "@/auth/passkeys";
import { registerPasskey } from "../components/passkey-client";

async function call(method: "GET" | "PATCH" | "DELETE", body?: unknown): Promise<PasskeySummary[]> {
  const res = await fetch("/api/auth/passkeys", { method, credentials: "same-origin", headers: body ? { "content-type": "application/json" } : undefined, body: body ? JSON.stringify(body) : undefined });
  const data = (await res.json().catch(() => ({}))) as { passkeys?: PasskeySummary[]; error?: string };
  if (!res.ok) throw new Error(data.error ?? "Something went wrong");
  return data.passkeys ?? [];
}

const when = (iso: string | null) => (iso ? new Date(iso).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" }) : "Not recorded");

/** The list and its actions. The server enforces every rule; this only shows them. */
export function PasskeysManager({ initial }: { initial: PasskeySummary[] }) {
  const [keys, setKeys] = useState(initial);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);
  const [newName, setNewName] = useState("");
  const [editing, setEditing] = useState<string | null>(null);
  const [draft, setDraft] = useState("");

  const run = async (fn: () => Promise<PasskeySummary[]>, done: string) => {
    setBusy(true);
    setError("");
    setNotice("");
    try {
      setKeys(await fn());
      setNotice(done);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div style={{ display: "grid", gap: 24, maxWidth: 720 }}>
      <table className="table">
        <caption style={{ textAlign: "start" }}>{keys.length === 1 ? "1 passkey" : `${keys.length} passkeys`}</caption>
        <thead>
          <tr>
            <th scope="col">Name</th>
            <th scope="col">Added</th>
            <th scope="col">Last used</th>
            <th scope="col">Actions</th>
          </tr>
        </thead>
        <tbody>
          {keys.map((k) => (
            <tr key={k.id}>
              <td>
                {editing === k.id ? (
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      run(() => call("PATCH", { id: k.id, name: draft }), "Renamed.").then(() => setEditing(null));
                    }}
                    style={{ display: "flex", gap: 8 }}
                  >
                    <input className="field-type" aria-label={`New name for ${k.name}`} value={draft} onChange={(e) => setDraft(e.target.value)} maxLength={60} required />
                    <button type="submit" className="btn btn--style-primary btn--size-small" disabled={busy}>Save</button>
                    <button type="button" className="btn btn--style-secondary btn--size-small" onClick={() => setEditing(null)}>Cancel</button>
                  </form>
                ) : (
                  k.name
                )}
              </td>
              <td>{when(k.createdAt)}</td>
              <td>{when(k.lastUsedAt)}</td>
              <td style={{ display: "flex", gap: 8 }}>
                <button type="button" className="btn btn--style-secondary btn--size-small" disabled={busy} onClick={() => (setEditing(k.id), setDraft(k.name))} aria-label={`Rename ${k.name}`}>
                  Rename
                </button>
                <button
                  type="button"
                  className="btn btn--style-secondary btn--size-small"
                  disabled={busy || keys.length <= 1}
                  title={keys.length <= 1 ? "Your only passkey cannot be removed. Add another first." : undefined}
                  aria-label={`Remove ${k.name}`}
                  onClick={() => {
                    if (window.confirm(`Remove the passkey "${k.name}"? You will no longer be able to sign in with it.`)) run(() => call("DELETE", { id: k.id }), "Removed.");
                  }}
                >
                  Remove
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          run(async () => {
            await registerPasskey({ label: newName });
            return call("GET");
          }, "Passkey added.").then(() => setNewName(""));
        }}
        style={{ display: "grid", gap: 8, maxWidth: 480 }}
      >
        <h2>Add another passkey</h2>
        <label>
          Name (for example &ldquo;YubiKey 5C&rdquo; or &ldquo;Phone&rdquo;)
          <input className="field-type" value={newName} onChange={(e) => setNewName(e.target.value)} maxLength={60} required />
        </label>
        <button type="submit" className="btn btn--style-primary" disabled={busy}>Add a passkey on this device or a security key</button>
      </form>

      {error && <p role="alert">{error}</p>}
      {notice && <p role="status">{notice}</p>}
    </div>
  );
}
