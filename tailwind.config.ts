import type { Config } from "tailwindcss";


export default {
  content: [
    "./components/**/*.{vue,js,ts}",
    "./layouts/**/*.vue",
    "./pages/**/*.vue",
    "./plugins/**/*.{js,ts}",
    "./app.vue"
  ],
  theme: {
    extend: {
      colors: {
        ink: "#0f172a",
        slatey: "#475569",
        paper: "#ffffff",
        money: "#16a34a",
        leaf: "#22c55e"
      },
      boxShadow: {
        soft: "0 6px 24px rgba(2,6,23,.06)"
      },
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui"]
      }
    }
  },
  plugins: []
} satisfies Config;
