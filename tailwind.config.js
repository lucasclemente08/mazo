/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        amber: {50:'#fcf7eb',100:'#f5e8ca',200:'#eddaaf',300:'#eac784',400:'#dfba76',500:'#cca461',600:'#b58a45',700:'#8c6935',800:'#66502e',900:'#493b26',950:'#2b251b'},
        emerald: {50:'#edf4ef',100:'#dce9df',200:'#bed4c4',300:'#99bfa4',400:'#76a78a',500:'#588f6e',600:'#3e7556',700:'#2f6045',800:'#254d38',900:'#1d382a',950:'#10291c'},
        stone: {50:'#f8f7f0',100:'#eeeee2',200:'#d9dfd0',300:'#c2ccbe',400:'#98ab99',500:'#758d7a',600:'#526c59',700:'#395440',800:'#243c2c',900:'#192c20',950:'#102016'},
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
