// Next 16 dropped `next lint`; this runs Next's recommended rules through ESLint directly
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const config = [
  ...nextVitals,
  ...nextTs,
  { ignores: [".next/**", "node_modules/**", "public/**", "scripts/**", "next-env.d.ts"] },
];

export default config;
