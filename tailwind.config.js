/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx,html}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        teal: {
          400: '#3cddc7',
          500: '#2dd4bf',
          600: '#006b5f',
        },
        surface: {
          DEFAULT: '#0e1513',
          container: '#1a211f',
          high: '#242b2a',
          border: '#2f3634',
        }
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      }
    },
  },
  plugins: [],
}
