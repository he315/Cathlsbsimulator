/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        // "Clinical Graphite": neutral graphite surfaces, hairline borders, one clinical blue
        base: {
          900: "#0E1013", // ground
          800: "#121417", // sidebar, headers
          700: "#15181C", // surface (panels)
          600: "#1B1F24", // raised, hover
          500: "#22262C", // hairline
          400: "#2E343C", // strong border
        },
        line: "#22262C",
        "line-strong": "#2E343C",
        ink: {
          DEFAULT: "#ECEEF1",
          soft: "#A6ADB8",
          faint: "#858D99",
        },
        accent: {
          DEFAULT: "#4F8EF7", // text, indicators, focus on dark
          strong: "#2F6BD8", // filled primary buttons (white text passes 4.5:1)
          tint: "#1B2230", // selected rows, active nav
        },
        safe: "#56B6E8",
        good: "#4CC38A",
        warn: "#E9B95A",
        danger: "#E5534B",
        gold: "#E9B95A",
        // monitor trace colours: only on monitors
        ecg: "#4FE0A0",
        art: "#FF7A85",
        spo2: "#4FD6EE",
      },
      fontFamily: {
        sans: ['"IBM Plex Sans"', "system-ui", "-apple-system", '"Segoe UI"', "sans-serif"],
        mono: ['"IBM Plex Mono"', "ui-monospace", "SFMono-Regular", "Menlo", "monospace"],
      },
      boxShadow: {
        panel: "0 1px 2px rgba(0,0,0,0.25)",
        glow: "0 0 0 1px rgba(79,142,247,0.35)",
        led: "none",
      },
      keyframes: {
        pulseline: {
          "0%,100%": { opacity: "0.35" },
          "50%": { opacity: "1" },
        },
        fadein: {
          from: { opacity: "0", transform: "translateY(4px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        blip: {
          "0%,100%": { transform: "scale(1)", opacity: "0.9" },
          "45%": { transform: "scale(1.35)", opacity: "1" },
        },
        ledpulse: {
          "0%,100%": { opacity: "1" },
          "50%": { opacity: "0.45" },
        },
      },
      animation: {
        pulseline: "pulseline 1.6s ease-in-out infinite",
        fadein: "fadein 0.25s ease-out",
        blip: "blip 0.9s ease-in-out infinite",
        ledpulse: "ledpulse 1.1s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};
