/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx,html}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#2563EB',
          hover: '#1D4ED8',
          light: '#EFF6FF',
        },
        secondary: {
          DEFAULT: '#64748B',
          hover: '#475569',
          light: '#F8FAFC',
        },
        tertiary: {
          DEFAULT: '#BC4800',
          hover: '#9A3B00',
          light: '#FFF7ED',
        },
        neutral: {
          DEFAULT: '#757681',
          light: '#F0F2F8',
          card: '#FFFFFF',
          border: '#E2E8F0',
        },
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
