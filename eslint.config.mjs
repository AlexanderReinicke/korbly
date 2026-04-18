import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const config = [
  ...nextVitals,
  ...nextTs,
  {
    ignores: [
      ".claude/**",
      ".next/**",
      "node_modules/**",
      "*.mjs",
      "out-*.json",
      "slug-*.json",
      "tool-schemas.json",
      "tool-schemas.txt"
    ]
  },
  {
    rules: {
      "@next/next/no-img-element": "off",
      "react-hooks/set-state-in-effect": "off",
      "react-hooks/immutability": "off"
    }
  }
];

export default config;
