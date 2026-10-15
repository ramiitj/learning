"use client";
import { useState } from "react";
import { signInWithPasskey } from "@/cms/components/passkey-client";

export function SignInHere() {
  const [error, setError] = useState("");
  return (
    <>
      <button
        type="button"
        style={{ padding: "10px 16px" }}
        onClick={async () => {
          try {
            await signInWithPasskey();
            window.location.reload();
          } catch (e) {
            setError((e as Error).message);
          }
        }}
      >
        Sign in with your passkey
      </button>
      {error && <p role="alert">{error}</p>}
    </>
  );
}
