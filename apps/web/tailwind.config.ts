import type { Config } from "tailwindcss"

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        space:   { DEFAULT: "#03060F", "100": "#060D1A", "200": "#0A1628" },
        aurora:  { DEFAULT: "#00FFB2", dim: "#00CC8E" },
        stellar: { DEFAULT: "#4DA6FF", dim: "#2D7ACC" },
        alert:   { DEFAULT: "#FF4D6D", dim: "#CC3D57" },
        orbit:   { DEFAULT: "#FFB84D", dim: "#CC8F2D" },
      },
      fontFamily: {
        mono: ["JetBrains Mono", "monospace"],
        sans: ["Inter", "sans-serif"],
      },
      animation: {
        pulse_slow: "pulse 4s cubic-bezier(0.4,0,0.6,1) infinite",
        scan:       "scan 3s linear infinite",
      },
      keyframes: {
        scan: {
          "0%":   { transform: "translateY(-100%)" },
          "100%": { transform: "translateY(100%)" },
        },
      },
    },
  },
  plugins: [],
}

export default config
