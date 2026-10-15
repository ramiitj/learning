"use client";
import { useState } from "react";
import { signInWithPasskey } from "./passkey-client";

/** Publishing and other always-ask actions need a passkey confirmation from the last five minutes. */
export function ReauthButton() {
  const [state, setState] = useState<"idle" | "busy" | "done" | "error">("idle");
  return (
    <button
      type="button"
      className="btn btn--style-secondary btn--size-small"
      title="Publishing needs a passkey confirmation from the last five minutes."
      onClick={async () => {
        setState("busy");
        try {
          await signInWithPasskey();
          setState("done");
        } catch {
          setState("error");
        }
      }}
    >
      {state === "done" ? "Confirmed for 5 minutes" : state === "error" ? "Not confirmed. Try again" : "Confirm with passkey"}
    </button>
  );
}
