/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: "#1E3A8A", // Deep blue
        secondary: "#10B981", // Emerald
        accent: "#F59E0B", // Amber
        background: "#F8FAFC",
        dark: "#1E293B",
      }
    },
  },
  plugins: [],
}
