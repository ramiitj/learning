import type { AdminViewServerProps } from "payload";
import { DefaultTemplate } from "@payloadcms/next/templates";
import { Gutter } from "@payloadcms/ui";
import { actorOf } from "../access";
import { reviewStrings } from "./actions";
import { InviteReviewer } from "./InviteReviewer";

const NAMES: Record<string, string> = { hi: "Hindi", te: "Telugu" };

/**
 * Translation review (docs/07, docs/10). Native speakers see each English
 * string beside its translation in context, correct it, and approve it.
 * A locale can be published only once every string has a current approval.
 */
export async function TranslationsView({ initPageResult, params, searchParams }: AdminViewServerProps) {
  const { req, permissions, visibleEntities, locale } = initPageResult;
  const actor = actorOf(req);
  const myLocales = actor.kind === "creator" ? ["hi", "te"] : actor.kind === "reviewer" ? actor.locales : [];
  const q = await searchParams;
  const lessons = await req.payload.find({ collection: "lessons", limit: 200, draft: true, overrideAccess: true, depth: 0 });
  const selected = lessons.docs.find((l) => String(l.id) === q?.lesson);
  const lang = typeof q?.locale === "string" && myLocales.includes(q.locale) ? q.locale : myLocales[0];

  const body = selected && lang ? (() => {
    const doc = selected.doc as { strings: Record<string, Record<string, string>>; localeStatus: Record<string, string> };
    const reviews = ((selected.reviews as Record<string, Record<string, { by: string; at: string }>>) ?? {})[lang] ?? {};
    const en = doc.strings.en ?? {};
    return (
      <form action={reviewStrings}>
        <input type="hidden" name="lesson" value={String(selected.id)} />
        <input type="hidden" name="locale" value={lang} />
        <p>
          {NAMES[lang]}: <strong>{doc.localeStatus[lang]}</strong>. Approved {Object.keys(reviews).length} of {Object.keys(en).length} strings.
        </p>
        <table style={{ width: "100%" }}>
          <thead><tr><th style={{ width: "40%" }}>English</th><th>{NAMES[lang]}</th><th>Approve</th></tr></thead>
          <tbody>
            {Object.entries(en).map(([key, text]) => (
              <tr key={key} style={{ verticalAlign: "top" }}>
                <td><small><code>{key}</code></small><br />{text}</td>
                <td><textarea name={`s:${key}`} defaultValue={doc.strings[lang]?.[key] ?? ""} rows={2} style={{ width: "100%" }} lang={lang} /></td>
                <td><input type="checkbox" name={`ok:${key}`} defaultChecked={!!reviews[key]} aria-label={`Approve ${key}`} /></td>
              </tr>
            ))}
          </tbody>
        </table>
        <button type="submit" className="btn btn--style-primary">Save corrections and approvals</button>
      </form>
    );
  })() : null;

  return (
    <DefaultTemplate i18n={req.i18n} locale={locale} params={params} payload={req.payload} permissions={permissions} searchParams={searchParams} user={req.user ?? undefined} visibleEntities={visibleEntities}>
      <Gutter>
        <h1>Translation review</h1>
        {!myLocales.length ? <p>Only the creator and invited native-speaker reviewers can review translations.</p> : (
          <>
            <ul>
              {lessons.docs.map((l) => (
                <li key={l.id}>
                  {l.title}:{" "}
                  {myLocales.map((lc) => (
                    <a key={lc} href={`/console/translations?lesson=${l.id}&locale=${lc}`} style={{ marginInlineEnd: 12 }}>
                      {NAMES[lc]} ({(l.doc as { localeStatus?: Record<string, string> }).localeStatus?.[lc] ?? "missing"})
                    </a>
                  ))}
                </li>
              ))}
            </ul>
            {body}
            {actor.kind === "creator" ? <InviteReviewer /> : null}
          </>
        )}
      </Gutter>
    </DefaultTemplate>
  );
}
