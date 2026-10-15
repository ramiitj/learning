"use client";
import { useActionState } from "react";
import { inviteReviewer } from "./actions";

export function InviteReviewer() {
  const [state, action, pending] = useActionState(inviteReviewer, {});
  return (
    <section style={{ marginTop: 32 }}>
      <h2>Invite a native-speaker reviewer</h2>
      <form action={action} style={{ display: "grid", gap: 8, maxWidth: 480 }}>
        <label>Name <input name="name" required className="field-type" /></label>
        <fieldset>
          <legend>Languages they may approve</legend>
          <label><input type="checkbox" name="locales" value="hi" /> Hindi</label>{" "}
          <label><input type="checkbox" name="locales" value="te" /> Telugu</label>
        </fieldset>
        <button type="submit" className="btn btn--style-primary" disabled={pending}>Create invitation</button>
      </form>
      {state.error && <p role="alert">{state.error}</p>}
      {state.link && (
        <p>
          Send them this link (valid 7 days): <code style={{ wordBreak: "break-all" }}>{state.link}</code>
        </p>
      )}
    </section>
  );
}
