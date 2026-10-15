import type { AdminViewServerProps } from "payload";
import { DefaultTemplate } from "@payloadcms/next/templates";
import { Gutter } from "@payloadcms/ui";
import { isCreator, recentlyAuthenticated } from "../access";
import { summarise, type StoredPasskey } from "@/auth/passkeys";
import { PasskeysManager } from "./PasskeysManager";

/**
 * "Your passkeys" (docs/10: passkey sign-in, a tested recovery path). The
 * creator sees each passkey's name, when it was added and last used, never
 * any key material; adds another (so losing one device does not lock them
 * out), renames, and removes (never the last one).
 */
export async function PasskeysView({ initPageResult, params, searchParams }: AdminViewServerProps) {
  const { req, permissions, visibleEntities, locale } = initPageResult;
  const creator = isCreator(req);
  const fresh = recentlyAuthenticated(req);
  let initial = summarise([]);
  if (creator && req.user) {
    const me = (await req.payload.findByID({ collection: "users", id: req.user.id, depth: 0, overrideAccess: true, showHiddenFields: true })) as { passkeys?: StoredPasskey[] };
    initial = summarise(me.passkeys);
  }
  return (
    <DefaultTemplate i18n={req.i18n} locale={locale} params={params} payload={req.payload} permissions={permissions} searchParams={searchParams} user={req.user ?? undefined} visibleEntities={visibleEntities}>
      <Gutter>
        <h1>Your passkeys</h1>
        {creator ? (
          <>
            <p>Keep at least two: a passkey that syncs (iCloud Keychain, Google Password Manager) and a hardware security key, so losing one device does not lock you out.</p>
            {!fresh && <p role="status">Adding or removing a passkey is a sensitive action: use &ldquo;Confirm with passkey&rdquo; at the top right first. Renaming does not need it.</p>}
            <PasskeysManager initial={initial} />
          </>
        ) : (
          <p role="status">Only the creator manages passkeys here.</p>
        )}
      </Gutter>
    </DefaultTemplate>
  );
}
