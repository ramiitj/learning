import type { AdminViewServerProps } from "payload";
import { DefaultTemplate } from "@payloadcms/next/templates";
import { Gutter } from "@payloadcms/ui";
import { catalogue as contracts, catalogueMessages as componentMessages } from "@lm/catalogue";

/** Platform: the component registry. New components are always-ask: they are proposed in the decision queue, never added here. */
export async function ComponentsView({ initPageResult, params, searchParams }: AdminViewServerProps) {
  const { req, permissions, visibleEntities, locale } = initPageResult;
  const lessons = await req.payload.find({ collection: "lessons", limit: 500, draft: true, overrideAccess: true, depth: 0 });
  const usedIn = (type: string) => lessons.docs.filter((l) => JSON.stringify((l.doc as { stages?: unknown }).stages ?? []).includes(`"type":"${type}"`)).map((l) => l.lessonId);
  return (
    <DefaultTemplate i18n={req.i18n} locale={locale} params={params} payload={req.payload} permissions={permissions} searchParams={searchParams} user={req.user ?? undefined} visibleEntities={visibleEntities}>
      <Gutter>
        <h1>Component registry</h1>
        <p>Every component lessons can use. Adding one is an architecture change: agents propose it in the decision queue.</p>
        <table>
          <thead>
            <tr><th>Component</th><th>Versions</th><th>Learner act</th><th>Live voting</th><th>First-use hint (en)</th><th>Used in</th></tr>
          </thead>
          <tbody>
            {contracts.map((c) => (
              <tr key={c.type}>
                <td><code>{c.type}</code></td>
                <td>{c.versions.join(", ")}</td>
                <td>{c.act}</td>
                <td>{c.vote ? "yes" : "—"}</td>
                <td>{componentMessages[c.type]?.en?.howto ?? "—"}</td>
                <td>{usedIn(c.type).join(", ") || "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Gutter>
    </DefaultTemplate>
  );
}
