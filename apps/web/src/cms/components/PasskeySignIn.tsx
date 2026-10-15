"use client";
import { useState } from "react";
import { registerPasskey, signInWithPasskey } from "./passkey-client";

/** The console's only way in: a passkey. First-time setup needs the one-time setup token from the server's environment. */
export function PasskeySignIn() {
  const invite = typeof window !== "undefined" ? new URLSearchParams(window.location.search).get("invite") : null;
  const [mode, setMode] = useState<"signin" | "setup">("signin");
  const [name, setName] = useState("");
  const [token, setToken] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const run = async (fn: () => Promise<void>) => {
    setBusy(true);
    setError("");
    try {
      await fn();
      // A full load, so the console reads the new session cookie on the server.
      // eslint-disable-next-line @next/next/no-location-assign-relative-destination
      window.location.assign("/console");
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div style={{ display: "grid", gap: "1rem", maxWidth: 420 }}>
      {invite ? (
        <>
          <p>You have been invited to review translations. Create a passkey on this device to accept.</p>
          <button type="button" className="btn btn--style-primary" disabled={busy} onClick={() => run(() => registerPasskey({ invite, label: "Reviewer passkey" } as never))}>
            Accept and create my passkey
          </button>
        </>
      ) : mode === "signin" ? (
        <>
          <button type="button" className="btn btn--style-primary" disabled={busy} onClick={() => run(signInWithPasskey)}>
            Sign in with your passkey
          </button>
          <button type="button" className="btn btn--style-secondary" onClick={() => setMode("setup")}>
            First time? Set up the creator account
          </button>
        </>
      ) : (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            run(() => registerPasskey({ name, setupToken: token, label: "First passkey" }));
          }}
          style={{ display: "grid", gap: "0.75rem" }}
        >
          <label>
            Your name
            <input className="field-type" value={name} onChange={(e) => setName(e.target.value)} required autoComplete="name" />
          </label>
          <label>
            Setup token (from the server&apos;s CREATOR_SETUP_TOKEN)
            <input className="field-type" value={token} onChange={(e) => setToken(e.target.value)} required autoComplete="off" />
          </label>
          <button type="submit" className="btn btn--style-primary" disabled={busy}>
            Create the account and its passkey
          </button>
          <button type="button" className="btn btn--style-secondary" onClick={() => setMode("signin")}>
            Back to sign-in
          </button>
        </form>
      )}
      {error && (
        <p role="alert" style={{ color: "var(--theme-error-500)" }}>
          {error}
        </p>
      )}
    </div>
  );
}
