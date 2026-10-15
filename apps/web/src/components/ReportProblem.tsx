"use client";
import { useId, useRef, useState } from "react";
import { useTranslations } from "next-intl";

type Role = "learner" | "teacher" | "other";

/**
 * "Report a problem" (docs/11): at the end of every lesson, in personal and
 * classroom mode. No name or contact details are asked for; the lesson and
 * language are filled in automatically.
 */
export function ReportProblem({ lessonId, locale }: { lessonId: string; locale: string }) {
  const t = useTranslations("report");
  const uid = useId();
  const [open, setOpen] = useState(false);
  const [state, setState] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [role, setRole] = useState<Role>("learner");
  const [message, setMessage] = useState("");
  const done = useRef<HTMLParagraphElement>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!message.trim()) return;
    setState("sending");
    try {
      const res = await fetch("/api/report", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ role, message, lessonId, locale }) });
      if (!res.ok) throw new Error(String(res.status));
      setState("sent");
      setMessage("");
      queueMicrotask(() => done.current?.focus());
    } catch {
      setState("error");
    }
  }

  return (
    <aside className="report" aria-labelledby={`${uid}-h`}>
      <h2 id={`${uid}-h`} className="report__title">
        {t("title")}
      </h2>
      {state === "sent" ? (
        <p ref={done} tabIndex={-1} role="status" className="report__done">
          {t("thanks")}
        </p>
      ) : (
        <>
          <button type="button" className="report__toggle" aria-expanded={open} aria-controls={`${uid}-form`} onClick={() => setOpen((o) => !o)}>
            {t("open")}
          </button>
          {open ? (
            <form id={`${uid}-form`} className="report__form" onSubmit={submit}>
              <p id={`${uid}-note`} className="report__note">
                <strong>{t("noPersonal")}</strong>
              </p>
              <label htmlFor={`${uid}-role`}>{t("role")}</label>
              <select id={`${uid}-role`} value={role} onChange={(e) => setRole(e.target.value as Role)}>
                <option value="learner">{t("roleLearner")}</option>
                <option value="teacher">{t("roleTeacher")}</option>
                <option value="other">{t("roleOther")}</option>
              </select>
              <label htmlFor={`${uid}-msg`}>{t("message")}</label>
              <textarea id={`${uid}-msg`} required rows={4} maxLength={1000} value={message} onChange={(e) => setMessage(e.target.value)} aria-describedby={`${uid}-note`} />
              <button type="submit" disabled={state === "sending"}>
                {state === "sending" ? t("sending") : t("send")}
              </button>
              {state === "error" ? (
                <p role="alert" className="report__error">
                  {t("error")}
                </p>
              ) : null}
            </form>
          ) : null}
        </>
      )}
    </aside>
  );
}
