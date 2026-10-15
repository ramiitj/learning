"use client";
import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";

export interface Question {
  prompt: string;
  options: { id: string; label: string }[];
  /** Item-by-item votes (sort): item id -> label. */
  items?: Record<string, string>;
}

interface State {
  blockId: string | null;
  itemId: string | null;
  votingOpen: boolean;
  ended: boolean;
}

export function JoinForm({ locale }: { locale: string }) {
  const t = useTranslations("join");
  const router = useRouter();
  const [code, setCode] = useState("");
  return (
    <form
      className="join__form"
      onSubmit={(e) => {
        e.preventDefault();
        const c = code.toUpperCase().replace(/[^A-Z0-9]/g, "");
        if (c.length === 6) router.push(`/join/${c}`, { locale });
      }}
    >
      <label htmlFor="join-code">{t("codeLabel")}</label>
      <input id="join-code" className="join__input" value={code} onChange={(e) => setCode(e.target.value)} inputMode="text" autoCapitalize="characters" autoComplete="off" maxLength={8} required pattern="[A-Za-z0-9 ]{6,8}" />
      <button type="submit" className="join__submit">{t("submit")}</button>
    </form>
  );
}

/** A random token for this session, kept on this phone only, so a phone votes once per question. */
function phoneToken(code: string): string {
  const k = `lm-vote:${code}`;
  try {
    const existing = localStorage.getItem(k);
    if (existing) return existing;
    const bytes = crypto.getRandomValues(new Uint8Array(16));
    const token = Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
    localStorage.setItem(k, token);
    return token;
  } catch {
    return Array.from(crypto.getRandomValues(new Uint8Array(16)), (b) => b.toString(16).padStart(2, "0")).join("");
  }
}

export function PhoneVote({ code, questions }: { code: string; questions: Record<string, Question> }) {
  const t = useTranslations("join");
  const [state, setState] = useState<State | null>(null);
  const [mine, setMine] = useState<Record<string, string>>({});
  const [closed, setClosed] = useState(false);

  useEffect(() => {
    let poll: ReturnType<typeof setInterval> | undefined;
    const fetchOnce = () => fetch(`/api/classroom/sessions/${code}`, { cache: "no-store" }).then((r) => (r.ok ? r.json() : null)).then((s) => s && setState(s)).catch(() => undefined);
    const es = new EventSource(`/api/classroom/sessions/${code}/events`);
    es.onmessage = (e) => setState(JSON.parse(e.data));
    es.onerror = () => (poll ??= setInterval(fetchOnce, 2500));
    es.onopen = () => {
      if (poll) clearInterval(poll);
      poll = undefined;
    };
    return () => {
      es.close();
      if (poll) clearInterval(poll);
    };
  }, [code]);

  useEffect(() => setClosed(false), [state?.blockId, state?.itemId]);

  if (state?.ended) return <p className="join__status">{t("ended")}</p>;
  const q = state?.blockId ? questions[state.blockId] : undefined;
  if (!state || !q || !state.votingOpen || (q.items && !state.itemId)) return <p className="join__status">{t("waiting")}</p>;

  const key = `${state.blockId}|${state.itemId ?? ""}`;
  const vote = async (choice: string) => {
    setMine((m) => ({ ...m, [key]: choice }));
    const res = await fetch(`/api/classroom/sessions/${code}/vote`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ token: phoneToken(code), blockId: state.blockId, itemId: state.itemId ?? undefined, choice }) }).catch(() => null);
    if (res?.status === 409) setClosed(true);
  };

  return (
    <section className="join__question" aria-live="polite">
      <h1 className="join__prompt">{q.items ? t("item") : q.prompt || t("voteOn")}</h1>
      {q.items && state.itemId ? <p className="join__item">{q.items[state.itemId]}</p> : null}
      <div className="join__options" role="group" aria-label={q.prompt || t("voteOn")}>
        {q.options.map((o) => (
          <button key={o.id} type="button" className="join__option" aria-pressed={mine[key] === o.id} onClick={() => vote(o.id)} disabled={closed}>
            {o.label}
          </button>
        ))}
      </div>
      {closed ? <p role="status">{t("closed")}</p> : mine[key] ? <p role="status">{t("voted")}</p> : null}
    </section>
  );
}
