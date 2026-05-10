import js from "@eslint/js";
import globals from "globals";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import { defineConfig, globalIgnores } from "eslint/config";

export default defineConfig([
  globalIgnores([
    "dist/**",
    "node_modules/**",
    ".git/**",
    ".kraft-sweep/**",

    // not active Vite UI
    "api/**",
    "builderbro/**",
    "core/**",
    "proxy/**",
    "qbtc-protocol/**",
    "tests/**",

    // generated / receipts / payloads
    "docs/**/*.json",
    "passes/**/*.json",
    "public/**/*.zip",
  ]),

  {
    files: ["src/**/*.{js,jsx,ts,tsx}"],
    extends: [
      js.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      ecmaVersion: 2022,
      globals: {
        ...globals.browser,
      },
      parserOptions: {
        ecmaFeatures: { jsx: true },
        sourceType: "module",
      },
    },
    rules: {
      "no-unused-vars": ["warn", { argsIgnorePattern: "^_", varsIgnorePattern: "^_" }],

      // migration tolerance: keep app shippable while we clean React 19 compiler strictness
      "react-hooks/static-components": "warn",
      "react-hooks/purity": "warn",
      "react-hooks/set-state-in-effect": "warn",
    },
  },
]);
