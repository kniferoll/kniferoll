/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        dark: {
          bg: "#0f172a",
          "bg-secondary": "#1e293b",
          text: "#f1f5f9",
          "text-secondary": "#cbd5e1",
          border: "#334155",
        },
      },
      // Animations are defined in index.css using @theme directive (Tailwind v4)
    },
  },
  plugins: [require("@tailwindcss/typography")],
};
