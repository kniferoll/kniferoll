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
      keyframes: {
        slideDown: {
          from: {
            opacity: "0",
            transform: "translateY(-8px)",
          },
          to: {
            opacity: "1",
            transform: "translateY(0)",
          },
        },
      },
      animation: {
        slideDown: "slideDown 0.2s ease-out",
      },
    },
  },
  plugins: [],
};
