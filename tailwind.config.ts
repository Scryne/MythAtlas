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
        background: "rgb(var(--rgb-bg-primary) / <alpha-value>)",
        foreground: "rgb(var(--rgb-text-primary) / <alpha-value>)",
        muted: "rgb(var(--rgb-text-secondary) / <alpha-value>)",
        surface: "rgb(var(--rgb-bg-surface) / <alpha-value>)",
        elevated: "rgb(var(--rgb-bg-elevated) / <alpha-value>)",
        overlay: "rgb(var(--rgb-bg-overlay) / <alpha-value>)",
        primaryText: "rgb(var(--rgb-text-primary) / <alpha-value>)",
        secondaryText: "rgb(var(--rgb-text-secondary) / <alpha-value>)",
        mutedText: "rgb(var(--rgb-text-muted) / <alpha-value>)",
        gold: {
          DEFAULT: "rgb(var(--rgb-gold) / <alpha-value>)",
          light: "rgb(var(--rgb-gold-light) / <alpha-value>)",
          dark: "rgb(var(--rgb-gold-dim) / <alpha-value>)",
        },
        red: {
          DEFAULT: "rgb(var(--rgb-red) / <alpha-value>)",
          light: "rgb(var(--rgb-red-light) / <alpha-value>)",
        },
        parchment: {
          DEFAULT: "rgb(var(--rgb-parchment) / <alpha-value>)",
          dark: "rgb(var(--rgb-parchment) / 0.82)",
          light: "rgb(var(--rgb-parchment) / 1)",
        },
        ink: {
          DEFAULT: "rgb(var(--rgb-bg-surface) / <alpha-value>)",
          light: "rgb(var(--rgb-bg-elevated) / <alpha-value>)",
        },
        stone: {
          DEFAULT: "rgb(var(--rgb-bg-overlay) / <alpha-value>)",
          light: "rgb(var(--rgb-bg-overlay) / 0.8)",
        },
      },
      fontFamily: {
        heading: ["var(--font-display)"],
        body: ["var(--font-body)"],
        decorative: ["var(--font-display)"],
        mono: ["var(--font-mono)"],
      },
      backgroundImage: {
        "parchment-texture":
          "url('/textures/parchment-noise.png')",
        "gold-gradient":
          "linear-gradient(135deg, rgb(var(--rgb-gold)) 0%, rgb(var(--rgb-gold-light)) 50%, rgb(var(--rgb-gold)) 100%)",
        "dark-gradient":
          "linear-gradient(180deg, rgb(var(--rgb-bg-primary)) 0%, rgb(var(--rgb-bg-surface)) 50%, rgb(var(--rgb-bg-primary)) 100%)",
        "hero-gradient":
          "radial-gradient(ellipse at center, rgb(var(--rgb-gold) / 0.15) 0%, rgb(var(--rgb-bg-primary) / 0) 70%)",
      },
      boxShadow: {
        gold: "var(--shadow-gold)",
        "gold-lg": "0 0 40px rgba(201, 168, 76, 0.25)",
        ancient:
          "var(--shadow-card), inset 0 1px 0 rgba(201, 168, 76, 0.1)",
      },
      borderColor: {
        ancient: "var(--color-border)",
      },
      borderRadius: {
        card: "var(--radius-card)",
        badge: "var(--radius-badge)",
        modal: "var(--radius-modal)",
      },
      animation: {
        "fade-in": "fadeIn 0.8s ease-out",
        "slide-up": "slideUp 0.6s ease-out",
        "glow-pulse": "glowPulse 3s ease-in-out infinite",
        float: "float 6s ease-in-out infinite",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideUp: {
          "0%": { opacity: "0", transform: "translateY(20px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        glowPulse: {
          "0%, 100%": { boxShadow: "0 0 20px rgba(201, 168, 76, 0.15)" },
          "50%": { boxShadow: "0 0 40px rgba(201, 168, 76, 0.3)" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-10px)" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
