"use client";
import { useActionState } from "react";
import { approveRevisionList } from "./pilotActions";

/** The revision list with a checkbox column; submitting records the creator's approval. */
export function PilotApprove({ from, to, items }: { from: string; to: string; items: { id: string; rank: number; kind: string; text: string; lessons: string }[] }) {
  const [state, action, pending] = useActionState(approveRevisionList, {} as { ok?: string; error?: string });
  if (!items.length) return <p>Nothing to revise.</p>;
  return (
    <form action={action}>
      <input type="hidden" name="from" value={from} />
      <input type="hidden" name="to" value={to} />
      <table>
        <thead>
          <tr><th scope="col">Approve</th><th scope="col">#</th><th scope="col">Kind</th><th scope="col">Revision</th><th scope="col">Lessons</th></tr>
        </thead>
        <tbody>
          {items.map((it) => (
            <tr key={it.id}>
              <td><input type="checkbox" name="approve" value={it.id} aria-label={`Approve item ${it.rank}`} /></td>
              <td>{it.rank}</td><td>{it.kind}</td><td>{it.text}</td><td>{it.lessons}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p>
        <button type="submit" className="btn btn--style-primary btn--size-medium" disabled={pending}>Approve ticked items</button>
      </p>
      <p role="status">{state.ok ?? state.error ?? ""}</p>
    </form>
  );
}
