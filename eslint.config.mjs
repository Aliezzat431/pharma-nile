import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,

  globalIgnores([
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    "node_modules/**",
  ]),

  // ─── PharmaNile Custom Rules ──────────────────────────────────────────────
  {
    rules: {
      // ── Error Prevention ──────────────────────────────────────────────────

      // Ban .single() from Supabase, in favor of .maybeSingle()
      "no-restricted-syntax": [
        "error",
        {
          selector: "MemberExpression[property.name='single']",
          message: "Use maybeSingle() instead of single() to avoid PGRST116 errors when no rows are found. Use '// eslint-disable-next-line no-restricted-syntax' if you absolutely require single() and understand risks."
        }
      ],

      // Ban console.log in production code — use structured logging
      "no-console": ["warn", { allow: ["error", "warn", "info"] }],


      // Disallow unused variables (catches dead code)
      "@typescript-eslint/no-unused-vars": [
        "error",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
          caughtErrorsIgnorePattern: "^_",
        },
      ],

      // Prefer const over let when variable is never reassigned
      "prefer-const": "error",

      // No implicit any — forces proper typing
      "@typescript-eslint/no-explicit-any": "warn",

      // Require nullish coalescing over || for potentially-null values
      // "@typescript-eslint/prefer-nullish-coalescing": "warn",

      // Require optional chaining over manual null checks
      // "@typescript-eslint/prefer-optional-chain": "warn",

      // ── Supabase-Specific ─────────────────────────────────────────────────
      // NOTE: .single() is banned — always use .maybeSingle() to avoid PGRST116.
      // This is enforced via the CI grep check in .github/workflows/ci.yml.
      // Add // safe-single comment if you absolutely need .single() and understand risks.

      // ── React Best Practices ──────────────────────────────────────────────

      // Require key prop in lists
      "react/jsx-key": "error",

      // Prevent direct mutation of state
      "no-param-reassign": ["warn", { props: false }],

      // ── Security ──────────────────────────────────────────────────────────

      // Prevent dangerouslySetInnerHTML usage (XSS risk)
      "react/no-danger": "error",

      // Prevent eval() (code injection risk)
      "no-eval": "error",
      "no-implied-eval": "error",

      // Prevent new Function() (code injection risk)
      "no-new-func": "error",
    },
  },
]);

export default eslintConfig;
