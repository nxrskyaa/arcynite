import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{js,ts,jsx,tsx,mdx}", "./components/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        skyglass: "#E9F9FF",
        lagoon: "#1BB7C9",
        mint: "#7BE6B2",
        coral: "#FF7B6B",
        sun: "#FFD166",
        lilac: "#B9A6FF",
        ink: "#26324B"
      },
      boxShadow: {
        soft: "0 18px 45px rgba(38, 50, 75, 0.12)",
        toy: "0 8px 0 rgba(38, 50, 75, 0.12), 0 18px 45px rgba(38, 50, 75, 0.14)"
      },
      fontFamily: {
        display: ["var(--font-display)", "ui-rounded", "system-ui", "sans-serif"],
        sans: ["var(--font-sans)", "ui-sans-serif", "system-ui", "sans-serif"]
      }
    }
  },
  plugins: []
};

export default config;
