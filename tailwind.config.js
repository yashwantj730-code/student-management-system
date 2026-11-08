/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      fontFamily: { sans: ["Inter", "ui-sans-serif", "system-ui", "sans-serif"], display: ["'Plus Jakarta Sans'", "Inter", "sans-serif"] },
      keyframes: {
        shimmer: { "100%": { transform: "translateX(100%)" } },
        float: { "0%,100%": { transform: "translateY(0)" }, "50%": { transform: "translateY(-14px)" } }
      },
      animation: { shimmer: "shimmer 1.6s infinite", float: "float 7s ease-in-out infinite" }
    }
  },
  plugins: []
};
