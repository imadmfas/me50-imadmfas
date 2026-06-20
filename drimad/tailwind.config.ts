import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        navy: {
          950: "#020810",
          900: "#050d1f",
          800: "#0a1628",
          700: "#0d1e35",
          600: "#122440",
        },
        gold: {
          300: "#f5d98a",
          400: "#e8c158",
          500: "#d4a843",
          600: "#b8891f",
        },
        teal: {
          400: "#3dd9c5",
          500: "#26c0aa",
        },
        silver: {
          200: "#d8e0ea",
          400: "#8899aa",
        },
      },
      fontFamily: {
        arabic: ["'Tajawal'", "Arial", "sans-serif"],
      },
      backgroundImage: {
        "gradient-gold": "linear-gradient(135deg, #b8891f 0%, #f5d98a 50%, #b8891f 100%)",
        "gradient-card": "linear-gradient(135deg, rgba(255,255,255,0.07) 0%, rgba(255,255,255,0.02) 100%)",
        "gradient-hero": "radial-gradient(ellipse 80% 60% at 50% 0%, #0d1e35 0%, #020810 100%)",
      },
      boxShadow: {
        gold: "0 0 40px rgba(212,168,67,0.3)",
        "gold-sm": "0 0 16px rgba(212,168,67,0.18)",
        glass: "0 8px 32px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.07)",
      },
      keyframes: {
        float: {
          "0%,100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-10px)" },
        },
      },
      animation: {
        float: "float 6s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};
export default config;
