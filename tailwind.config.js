/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        felt: {
          dark: '#0c2317',
          DEFAULT: '#14412a',
          light: '#1b5637',
          accent: '#267b4f'
        },
        card: {
          bg: '#fcfaf2',
          border: '#d6cfb8',
          gold: '#c29b38',
          sword: '#397097',
          club: '#3d7c47',
          cup: '#b43a3a'
        }
      },
      fontFamily: {
        sans: ['system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      boxShadow: {
        'card': '0 8px 24px -4px rgba(0, 0, 0, 0.4), 0 2px 6px -1px rgba(0, 0, 0, 0.2)',
        'card-hover': '0 16px 32px -4px rgba(0, 0, 0, 0.5), 0 4px 8px -1px rgba(0, 0, 0, 0.3)',
      }
    },
  },
  plugins: [],
}
