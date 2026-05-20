/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class', // Enables toggleable dark mode support
  theme: {
    extend: {
      colors: {
        brand: {
          dark: '#0f172a',      // Premium slate-900 background
          surface: '#1e293b',   // Premium slate-800 card surface
          border: '#334155',    // Premium slate-700 separator
          primary: '#8b5cf6',   // Rich violet accent
          secondary: '#10b981', // Vibrant emerald accent
          accent: '#06b6d4',    // Bright cyan accent
        }
      },
      fontFamily: {
        sans: ['Outfit', 'Inter', 'system-ui', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
