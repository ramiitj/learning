import js from "@eslint/js";
import nextPlugin from "@next/eslint-plugin-next";
import jsxA11y from "eslint-plugin-jsx-a11y";
import reactHooks from "eslint-plugin-react-hooks";
import globals from "globals";
import tseslint from "typescript-eslint";

export default tseslint.config(
  { ignores: ["**/node_modules/**", "**/.next/**", "**/dist/**", "**/coverage/**", "**/playwright-report/**", "**/test-results/**", "**/next-env.d.ts", "apps/web/public/sw.js", "infra/**"] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ["**/*.{ts,tsx}"],
    plugins: { "react-hooks": reactHooks, "jsx-a11y": jsxA11y },
    languageOptions: { globals: { ...globals.browser, ...globals.node } },
    rules: {
      ...reactHooks.configs.recommended.rules,
      ...jsxA11y.flatConfigs.recommended.rules,
      "@typescript-eslint/no-unused-vars": ["error", { argsIgnorePattern: "^_", varsIgnorePattern: "^_" }],
      // Labels wrap native inputs in pills and choice cards; the rule cannot see through our components.
      "jsx-a11y/label-has-associated-control": ["error", { assert: "either", depth: 3 }],
      // React Compiler rules are advisory here; the engine uses refs deliberately for focus management.
      "react-hooks/refs": "off",
      "react-hooks/set-state-in-effect": "off",
      // Only meaningful with the React Compiler, which this project does not use.
      "react-hooks/preserve-manual-memoization": "off",
    },
  },
  {
    // No hard-coded user-facing text in components (CLAUDE.md): JSX text must come from translators.
    files: ["packages/engine/src/**/*.tsx", "packages/primitives/src/**/*.tsx"],
    ignores: ["**/*.test.tsx", "**/test-utils.tsx"],
    rules: {
      "no-restricted-syntax": [
        "error",
        { selector: "JSXText[value=/[A-Za-z\\u0900-\\u097F\\u0C00-\\u0C7F]{2,}/]", message: "User-facing text must be localisable: use ui(key) or t.rich(key)." },
      ],
    },
  },
  {
    files: ["apps/web/**/*.{ts,tsx}"],
    plugins: { "@next/next": nextPlugin },
    settings: { next: { rootDir: "apps/web" } },
    rules: { ...nextPlugin.configs.recommended.rules, ...nextPlugin.configs["core-web-vitals"].rules, "@next/next/no-html-link-for-pages": "off" },
  },
);
