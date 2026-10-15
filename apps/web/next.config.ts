import path from "node:path";
import type { NextConfig } from "next";
import { withPayload } from "@payloadcms/next/withPayload";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

const config: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  // Offline lesson packs only (scripts/ops/build-pack.ts sets LM_PACK=1): a self-contained server.js. Normal builds are unchanged.
  ...(process.env.LM_PACK === "1" ? { output: "standalone" as const } : {}),
  transpilePackages: ["@lm/engine", "@lm/primitives", "@lm/schema", "@lm/tokens", "@lm/validation", "@lm/agents", "@lm/orchestrator", "@lm/catalogue", "@lm/sim-ai"],
  outputFileTracingRoot: path.join(import.meta.dirname, "../.."),
  // The export route bundles the repository's platform, docs and schemas folders; they sit outside the app folder.
  outputFileTracingIncludes: { "/api/export": ["../../platform/**/*", "../../docs/**/*", "../../schemas/**/*"] },
  turbopack: { root: path.join(import.meta.dirname, "../..") },
  async headers() {
    const security = [
      { key: "X-Content-Type-Options", value: "nosniff" },
      { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
      { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), interest-cohort=()" },
      { key: "X-Frame-Options", value: "SAMEORIGIN" },
    ];
    return [
      { source: "/:path*", headers: security },
      { source: "/sw.js", headers: [{ key: "Cache-Control", value: "no-cache" }, { key: "Service-Worker-Allowed", value: "/" }] },
    ];
  },
};

export default withPayload(withNextIntl(config), { devBundleServerPackages: false });
