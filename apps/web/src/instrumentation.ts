import type { Instrumentation } from "next";

/** Server errors go to our own database (docs/12), never to a third party. */
export const onRequestError: Instrumentation.onRequestError = async (err, request, context) => {
  if (process.env.NEXT_RUNTIME !== "nodejs" || !process.env.DATABASE_URI) return;
  try {
    const { cmsClient } = await import("@/cms/client");
    const { recordError } = await import("@/ops/errors");
    const e = err as { message?: unknown; stack?: unknown; digest?: unknown } | undefined;
    await recordError(await cmsClient(), { source: "server", message: e?.message ?? String(err), stack: e?.stack, route: context.routePath || request.path });
  } catch {
    /* monitoring must never take the site down */
  }
};
