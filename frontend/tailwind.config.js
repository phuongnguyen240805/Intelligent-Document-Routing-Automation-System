/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["DM Sans", "system-ui", "sans-serif"],
      },
      boxShadow: {
        drop: "0 25px 50px -12px rgba(15, 23, 42, 0.25)",
      },
    },
  },
  plugins: [],
};
