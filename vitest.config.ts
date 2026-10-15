import react from "@vitejs/plugin-react";
import path from "node:path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@payload-config": path.resolve(import.meta.dirname, "apps/web/src/cms/payload.config.ts"),
      "@/": `${path.resolve(import.meta.dirname, "apps/web/src")}/`,
    },
  },
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: ["./vitest.setup.ts"],
    include: ["packages/**/*.test.{ts,tsx}", "scripts/**/*.test.ts", "apps/web/src/**/*.test.{ts,tsx}"],
    css: false,
  },
});
