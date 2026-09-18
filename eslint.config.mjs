import { defineConfig, globalIgnores } from "eslint/config";
import tseslint from "typescript-eslint";
import next from "@next/eslint-plugin-next";
import hooks from "eslint-plugin-react-hooks";
export default defineConfig([
  ...tseslint.configs.recommended,
  // These fragments are assembled into one script by the pinned design builder.
  // Only bindings consumed by another fragment are exempt from unused checks.
  ...[
    ["customer-bridge.js", "sendResponse|openQuestion"],
    ["inspection-panel.js", "openBasis|closeBasis"],
    ["release-output.js", "output"],
    ["response-model.js", "ResponseModel"],
    ["response-ui.js", "icon"],
  ].map(([file, bindings]) => ({
    files: [`docs/blueprints/quotation-lifecycle/${file}`],
    rules: {
      "@typescript-eslint/no-unused-vars": ["error", { varsIgnorePattern: `^(${bindings})$` }],
    },
  })),
  {
    files: ["**/*.ts", "**/*.tsx"],
    plugins: { "@next/next": next, "react-hooks": hooks },
    rules: {
      ...next.configs.recommended.rules,
      ...hooks.configs.recommended.rules,
      "@typescript-eslint/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_" },
      ],
    },
  },
  {
    files: ["docs/blueprints/item-conversion/model.js"],
    rules: {
      // The generated workspace and VM checks consume this assembled binding.
      "@typescript-eslint/no-unused-vars": ["error", { varsIgnorePattern: "^Conversion$" }],
    },
  },
  globalIgnores([
    ".next/**",
    "public/offline/modules/**",
    "node_modules/**",
    "test-results/**",
    "playwright-report/**",
    "verification-evidence/crm-ui/**",
    "verification-evidence/crm-r38-five/**",
    "verification-evidence/projects-ui/**",
    "next-env.d.ts",
  ]),
]);
