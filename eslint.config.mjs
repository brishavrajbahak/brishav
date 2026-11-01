import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTypeScript from "eslint-config-next/typescript";

export default defineConfig([
  ...nextVitals,
  ...nextTypeScript,
  globalIgnores([
    ".next/**",
    "out/**",
    "node_modules/**",
    "legacy-site/**",
    ".wrangler/**",
    "**/.wrangler/**"
  ]),
  {
    files: ["functions/**/*.js", "workers/**/*.js"],
    rules: {
      "@typescript-eslint/no-explicit-any": "off",
      "import/no-anonymous-default-export": "off"
    }
  }
]);
