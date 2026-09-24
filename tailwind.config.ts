import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        void: "#04060A",
        panel: "#0A0E14",
        electric: "#1FB6FF",
        teal: "#12D6C0",
        gold: "#F5A623",
        frost: "#F6F8FB",
        muted: "#8A97A6",
        danger: "#FF4D4D",
      },
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
        display: ["var(--font-inter)", "system-ui", "sans-serif"],
        mono: ["var(--font-plex-mono)", "ui-monospace", "SFMono-Regular", "monospace"],
      },
      boxShadow: {
        glow: "0 0 0 1px rgba(255,255,255,0.05), 0 30px 80px -20px rgba(31,182,255,0.25)",
        "glow-sm": "0 0 0 1px rgba(255,255,255,0.05), 0 18px 50px -18px rgba(31,182,255,0.2)",
        "glow-cyan": "0 0 28px rgba(31,182,255,0.35)",
        "glow-teal": "0 0 28px rgba(18,214,192,0.3)",
        "glow-gold": "0 0 28px rgba(245,166,35,0.3)",
        "glow-red": "0 0 28px rgba(255,77,77,0.35)",
      },
      keyframes: {
        scanline: {
          "0%": { transform: "translateY(-12%)" },
          "100%": { transform: "translateY(112%)" },
        },
        statusPulse: {
          "0%, 100%": { opacity: "1", transform: "scale(1)" },
          "50%": { opacity: "0.35", transform: "scale(0.82)" },
        },
        stampIn: {
          "0%": { transform: "scale(1.8) rotate(-16deg)", opacity: "0" },
          "55%": { transform: "scale(0.94) rotate(-4deg)", opacity: "1" },
          "100%": { transform: "scale(1) rotate(-4deg)", opacity: "1" },
        },
      },
      animation: {
        scanline: "scanline 2.6s ease-in-out infinite",
        "status-pulse": "statusPulse 1.8s ease-in-out infinite",
        "stamp-in": "stampIn 0.5s cubic-bezier(0.2, 1.3, 0.4, 1) both",
      },
    },
  },
  plugins: [],
};

export default config;
