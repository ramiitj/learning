"use client";
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { useTranslations } from "next-intl";
import { LiveVotesContext, type LiveVotes } from "@lm/engine";

interface PublicState {
  code: string;
  blockId: string | null;
  itemId: string | null;
  votingOpen: boolean;
  revision: number;
  ended: boolean;
  votes: Record<string, Record<string, Record<string, number>>>;
  voters: number;
}

type Session = { code: string; hostKey: string };
const storageKey = (lessonId: string) => `lm-live:${lessonId}`;

function load(lessonId: string): Session | null {
  try {
    return JSON.parse(sessionStorage.getItem(storageKey(lessonId)) ?? "null");
  } catch {
    return null;
  }
}

/** Keeps the shared screen's state in step with the server: SSE, with polling when SSE is unavailable. */
function useSessionState(code: string | null) {
  const [state, setState] = useState<PublicState | null>(null);
  const [online, setOnline] = useState(true);
  useEffect(() => {
    if (!code) return;
    let poll: ReturnType<typeof setInterval> | undefined;
    const fetchOnce = () =>
      fetch(`/api/classroom/sessions/${code}`, { cache: "no-store" })
        .then((r) => (r.ok ? r.json() : null))
        .then((s) => s && (setState(s), setOnline(true)))
        .catch(() => setOnline(false));
    const es = typeof EventSource !== "undefined" ? new EventSource(`/api/classroom/sessions/${code}/events`) : null;
    if (es) {
      es.onmessage = (e) => {
        setState(JSON.parse(e.data));
        setOnline(true);
      };
      es.onerror = () => {
        setOnline(false);
        poll ??= setInterval(fetchOnce, 2000);
      };
      es.onopen = () => {
        if (poll) clearInterval(poll);
        poll = undefined;
      };
    } else {
      poll = setInterval(fetchOnce, 2000);
      fetchOnce();
    }
    return () => {
      es?.close();
      if (poll) clearInterval(poll);
    };
  }, [code]);
  return { state, online };
}

/**
 * Classroom mode with optional live voting from phones (Phase 2). The teacher
 * starts a session; students join with the code on the board. Whatever block
 * is on the projected screen is what phones vote on. Hands counted in the room
 * and phone votes add up in the same tally.
 */
export function LiveClassroom({ lessonId, locale, children }: { lessonId: string; locale: string; children: ReactNode }) {
  const t = useTranslations("live");
  const [session, setSession] = useState<Session | null>(null);
  const [status, setStatus] = useState<"idle" | "starting" | "failed">("idle");
  const items = useRef(new Map<string, string | null>());
  const shown = useRef<string>("");
  const [current, setCurrent] = useState<string | null>(null);
  const { state, online } = useSessionState(session?.code ?? null);

  useEffect(() => setSession(load(lessonId)), [lessonId]);

  const host = useCallback(
    (body: Record<string, unknown>) =>
      session ? fetch(`/api/classroom/sessions/${session.code}/host`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ hostKey: session.hostKey, ...body }) }).catch(() => undefined) : undefined,
    [session],
  );

  // Phones follow the block at the top of the shared screen.
  useEffect(() => {
    if (!session) return;
    const blocks = () => [...document.querySelectorAll<HTMLElement>(".lm-lesson .lm-block[data-block-id]")];
    const pick = () => {
      const visible = blocks().filter((el) => {
        const r = el.getBoundingClientRect();
        return r.bottom > window.innerHeight * 0.25 && r.top < window.innerHeight * 0.6;
      });
      setCurrent(visible[0]?.dataset.blockId ?? null);
    };
    pick();
    const io = new IntersectionObserver(pick, { threshold: [0, 0.25, 0.5, 0.75, 1] });
    blocks().forEach((b) => io.observe(b));
    window.addEventListener("scroll", pick, { passive: true });
    return () => {
      io.disconnect();
      window.removeEventListener("scroll", pick);
    };
  }, [session]);

  const [itemTick, setItemTick] = useState(0);
  useEffect(() => {
    if (!session || state?.ended) return;
    const itemId = current ? (items.current.get(current) ?? null) : null;
    const key = `${current}|${itemId}`;
    if (key === shown.current) return;
    shown.current = key;
    host({ action: "show", blockId: current, itemId });
  }, [current, itemTick, session, state?.ended, host]);

  const value = useMemo<LiveVotes>(
    () => ({
      connected: !!session && !!state && !state.ended,
      counts: (blockId, itemId) => state?.votes[blockId]?.[itemId ?? ""] ?? {},
      setItem: (blockId, itemId) => {
        if (items.current.get(blockId) === itemId) return;
        items.current.set(blockId, itemId);
        setItemTick((n) => n + 1);
      },
    }),
    [session, state],
  );

  const start = async () => {
    setStatus("starting");
    try {
      const res = await fetch("/api/classroom/sessions", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ lessonId, locale }) });
      if (!res.ok) throw new Error();
      const s = (await res.json()) as Session;
      sessionStorage.setItem(storageKey(lessonId), JSON.stringify(s));
      shown.current = "";
      setSession(s);
      setStatus("idle");
    } catch {
      setStatus("failed");
    }
  };
  const end = async () => {
    await host({ action: "end" });
    sessionStorage.removeItem(storageKey(lessonId));
    setSession(null);
  };

  const joinUrl = typeof window !== "undefined" ? `${window.location.host}/${locale}/join` : `/${locale}/join`;

  return (
    <LiveVotesContext.Provider value={value}>
      <section className="live-panel" aria-labelledby="live-title">
        <h2 id="live-title" className="live-panel__title">{t("title")}</h2>
        {!session ? (
          <>
            <p className="live-panel__intro">{t("intro")}</p>
            <button type="button" className="live-panel__start" onClick={start} disabled={status === "starting"}>
              {status === "starting" ? t("starting") : t("start")}
            </button>
            {status === "failed" ? <p role="alert">{t("failed")}</p> : null}
          </>
        ) : state?.ended ? (
          <p>{t("ended")}</p>
        ) : (
          <div className="live-panel__session">
            <QrCode text={`${typeof window !== "undefined" ? window.location.origin : ""}/${locale}/join/${session.code}`} />
            <div>
              <p className="live-panel__join">{t("joinAt", { url: joinUrl })}</p>
              <p className="live-panel__code" aria-label={t("code")}>
                {session.code}
              </p>
              <p aria-live="polite">{t("voters", { n: state?.voters ?? 0 })}</p>
              {!online ? <p role="status">{t("offline")}</p> : null}
              <button type="button" className="live-panel__end" onClick={end}>
                {t("end")}
              </button>
            </div>
          </div>
        )}
      </section>
      {children}
    </LiveVotesContext.Provider>
  );
}

/** A QR code drawn as SVG; the library loads only when a session starts. */
function QrCode({ text }: { text: string }) {
  const [svg, setSvg] = useState("");
  useEffect(() => {
    let alive = true;
    import("qrcode-generator").then(({ default: qrcode }) => {
      const qr = qrcode(0, "M");
      qr.addData(text);
      qr.make();
      if (alive) setSvg(qr.createSvgTag({ cellSize: 6, margin: 2, scalable: true }));
    });
    return () => {
      alive = false;
    };
  }, [text]);
  return <div className="live-panel__qr" aria-hidden="true" dangerouslySetInnerHTML={{ __html: svg }} />;
}
