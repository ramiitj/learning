import type { AdminViewServerProps } from "payload";
import { DefaultTemplate } from "@payloadcms/next/templates";
import { Gutter } from "@payloadcms/ui";
import { recentlyAuthenticated } from "../access";

/** "Export everything" (docs/03, docs/12): the creator's copy of the whole platform in open formats. */
export async function ExportView({ initPageResult, params, searchParams }: AdminViewServerProps) {
  const { req, permissions, visibleEntities, locale } = initPageResult;
  const fresh = recentlyAuthenticated(req);
  return (
    <DefaultTemplate i18n={req.i18n} locale={locale} params={params} payload={req.payload} permissions={permissions} searchParams={searchParams} user={req.user ?? undefined} visibleEntities={visibleEntities}>
      <Gutter>
        <h1>Export everything</h1>
        <p>A zip of every collection as JSON, the constitution, autonomy and budget, and the repository&apos;s platform and docs folders, with a manifest listing a checksum for each file.</p>
        <p>It leaves out sign-in credentials (passkeys), connector grants and live classroom sessions and votes. Analytics are included as daily totals only.</p>
        {fresh ? (
          <p>
            <a className="btn btn--style-primary btn--size-medium" href="/api/export" download>
              Download the export
            </a>
          </p>
        ) : (
          <p role="status">Exporting is a sensitive action: use &ldquo;Confirm with passkey&rdquo; at the top right, then reload this page.</p>
        )}
      </Gutter>
    </DefaultTemplate>
  );
}
