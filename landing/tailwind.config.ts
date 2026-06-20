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
        // Design tokens — glassmorphic dark theme derived from InsightGlass SwiftUI app
        bg: {
          base: "#0a0a0f",
          surface: "#12121a",
          glass: "rgba(255,255,255,0.06)",
        },
        brand: {
          violet: "#7c5cfc",
          blue: "#5c8afc",
          teal: "#3dd9c5",
        },
        text: {
          primary: "#f0f0f8",
          secondary: "#9090b0",
          muted: "#50506a",
        },
        border: {
          glass: "rgba(255,255,255,0.10)",
        },
      },
      fontFamily: {
        sans: ["var(--font-geist-sans)", "system-ui", "sans-serif"],
        mono: ["var(--font-geist-mono)", "monospace"],
      },
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "gradient-brand":
          "linear-gradient(135deg, #7c5cfc 0%, #5c8afc 50%, #3dd9c5 100%)",
        "gradient-glass":
          "linear-gradient(135deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.02) 100%)",
      },
      boxShadow: {
        glass: "0 8px 32px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.08)",
        glow: "0 0 40px rgba(124,92,252,0.3)",
        "glow-teal": "0 0 40px rgba(61,217,197,0.2)",
      },
      borderRadius: {
        xl2: "1.25rem",
        xl3: "1.5rem",
      },
      animation: {
        "pulse-slow": "pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        float: "float 6s ease-in-out infinite",
      },
      keyframes: {
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-12px)" },
        },
      },
    },
  },
  plugins: [],
};
export default config;
