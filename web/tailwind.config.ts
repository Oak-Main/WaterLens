import type { Config } from "tailwindcss";

// -----------------------------------------------------------------------------
// Design tokens (§13 UX & Trust Blueprint): clinical objectivity. Muted blues,
// greens, and grays; NO alarmist red/black. Semantic status colors are calm.
//
// Surface and content colors resolve through CSS custom properties (see
// globals.css) so the whole system themes light/dark from one place.
// -----------------------------------------------------------------------------
const config: Config = {
  darkMode: ["class", '[data-theme="dark"]'],
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Primary — deep, trustworthy municipal blue.
        brand: {
          25: "#f7fbfd",
          50: "#eef6fb",
          100: "#d6e9f4",
          200: "#aed3e9",
          300: "#7cb6d8",
          400: "#4a93c1",
          500: "#2b76a6",
          600: "#1f5c86",
          700: "#1c4a6b",
          800: "#1b3e59",
          900: "#1a344b",
          950: "#112232",
        },
        // Secondary — calm verdigris/teal for "verified / safe".
        verdant: {
          50: "#eff8f4",
          100: "#d6ede1",
          200: "#b0dcc6",
          300: "#7fc2a4",
          400: "#4fa17f",
          500: "#348465",
          600: "#276a51",
          700: "#215543",
          800: "#1d4437",
          900: "#19392f",
        },
        // Neutral — slate/stone grays for text and surfaces.
        // ink-500 darkened to #5b6878 so it clears 4.5:1 on the ink-50 canvas;
        // ink-400 and lighter are non-text values only (borders, decoration).
        ink: {
          25: "#fbfcfd",
          50: "#f6f7f9",
          100: "#eceef2",
          200: "#d5dae1",
          300: "#b0b9c6",
          400: "#77839a",
          500: "#5b6878",
          600: "#4c5766",
          700: "#434c58",
          800: "#3a414b",
          900: "#2b3038",
          950: "#1a1d22",
        },
        // Caution — amber. Reserved for regulatory-threshold reference and the
        // Tier-3 mapping-ambiguity banner. Deliberately NOT red.
        caution: {
          50: "#fdf8ec",
          100: "#fbf0d0",
          200: "#f6e0a1",
          300: "#efc968",
          400: "#e8b13c",
          500: "#d9971f",
          600: "#bd7817",
          700: "#985916",
          800: "#7d4818",
          900: "#693c18",
        },
        // Theme-aware semantic surfaces (resolved in globals.css).
        surface: {
          base: "var(--surface-base)",
          sunken: "var(--surface-sunken)",
          raised: "var(--surface-raised)",
        },
        hairline: "var(--hairline)",
      },
      fontFamily: {
        sans: ["var(--font-sans)", "ui-sans-serif", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "ui-monospace", "SFMono-Regular", "monospace"],
      },
      fontSize: {
        // Fluid display tier — optical tracking tightens as size grows.
        "display-1": [
          "clamp(1.9375rem, 1.25rem + 2.6vw, 3.5rem)",
          { lineHeight: "1.09", letterSpacing: "-0.03em", fontWeight: "600" },
        ],
        "display-2": [
          "clamp(2rem, 1.35rem + 2.4vw, 3.25rem)",
          { lineHeight: "1.09", letterSpacing: "-0.028em", fontWeight: "600" },
        ],
        "title-1": [
          "clamp(1.625rem, 1.25rem + 1.3vw, 2.25rem)",
          { lineHeight: "1.16", letterSpacing: "-0.021em", fontWeight: "600" },
        ],
        "title-2": [
          "1.375rem",
          { lineHeight: "1.28", letterSpacing: "-0.013em", fontWeight: "600" },
        ],
        lede: ["1.125rem", { lineHeight: "1.68", letterSpacing: "-0.004em" }],
        eyebrow: [
          "0.6875rem",
          { lineHeight: "1", letterSpacing: "0.16em", fontWeight: "600" },
        ],
      },
      boxShadow: {
        // A real elevation ramp with a brand-tinted shadow color, so cards read
        // as raised surfaces rather than outlines on a flat plane.
        e1: "0 1px 2px rgba(17,34,50,0.05), 0 1px 3px -1px rgba(17,34,50,0.07)",
        card:
          "0 1px 2px rgba(17,34,50,0.05), 0 4px 10px -4px rgba(17,34,50,0.10), 0 16px 32px -20px rgba(17,34,50,0.16)",
        lift:
          "0 2px 4px rgba(17,34,50,0.06), 0 12px 24px -8px rgba(17,34,50,0.13), 0 32px 56px -24px rgba(17,34,50,0.22)",
        overlay:
          "0 24px 64px -16px rgba(17,34,50,0.28), 0 0 0 1px rgba(27,62,89,0.06)",
        sheen: "inset 0 1px 0 rgba(255,255,255,0.7)",
      },
      borderRadius: {
        sm: "0.375rem",
        md: "0.5rem",
        lg: "0.75rem",
        xl: "0.875rem",
        "2xl": "1.25rem",
        "3xl": "1.75rem",
      },
      maxWidth: {
        content: "72rem",
        prose: "44rem",
      },
      keyframes: {
        "fade-up": {
          "0%": { opacity: "0", transform: "translateY(8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        shimmer: {
          "100%": { transform: "translateX(100%)" },
        },
      },
      animation: {
        "fade-up": "fade-up 0.55s cubic-bezier(0.22,0.61,0.36,1) both",
        shimmer: "shimmer 1.6s infinite",
      },
    },
  },
  plugins: [],
};

export default config;
