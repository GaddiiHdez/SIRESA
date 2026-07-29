/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx}",
  ],
  theme: {
    extend: {
      colors: {
        nayarit: {
          dark: '#1e3b2e',      // Verde institucional Nayarit profundo
          green: '#2d5e46',     // Verde institucional Nayarit medio
          lightGreen: '#4b8b68',// Verde claro de acento
          gold: '#b08b35',      // Dorado institucional Nayarit
          lightGold: '#d4af53', // Dorado claro brillante
          light: '#f5f7f6',     // Fondo ultra claro
          slate: '#4a5568'
        }
      },
      fontFamily: {
        sans: ['Outfit', 'Inter', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
