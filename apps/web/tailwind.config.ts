import type { Config } from "tailwindcss"

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        space:   { DEFAULT: "#030609", panel: "rgba(4,10,20,0.88)" },
        aurora:  { DEFAULT: "#00E5A0" },
        stellar: { DEFAULT: "#3D9BE9" },
        alert:   { DEFAULT: "#FF3355" },
        orbit:   { DEFAULT: "#F0A030" },
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
