import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      fontFamily: {
        display: ["var(--font-display)", "serif"],
        body: ["var(--font-body)", "sans-serif"]
      },
      colors: {
        ink: "rgb(var(--ink) / <alpha-value>)",
        muted: "rgb(var(--muted) / <alpha-value>)",
        line: "rgb(var(--line) / <alpha-value>)",
        paper: "rgb(var(--paper) / <alpha-value>)",
        warm: "rgb(var(--warm) / <alpha-value>)",
        leaf: "rgb(var(--leaf) / <alpha-value>)",
        tomato: "rgb(var(--tomato) / <alpha-value>)"
      },
      boxShadow: {
        lift: "0 16px 38px rgb(26 36 30 / 0.09)"
      }
    }
  },
  plugins: []
};

export default config;
