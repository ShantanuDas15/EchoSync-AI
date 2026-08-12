import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--bg-surface-root)",
        panel: "var(--bg-surface-panel)",
        elevated: "var(--bg-surface-elevated)",
        brand: {
          DEFAULT: "var(--brand-primary)",
          accent: "var(--brand-accent)",
        },
        status: {
          online: "var(--status-online)",
          warning: "var(--status-warning)",
          error: "var(--status-error)",
        },
      },
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "monospace"],
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
    },
  },
  plugins: [],
};

export default config;
