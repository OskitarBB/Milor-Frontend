/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{html,ts}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#fdf4f3',
          500: '#e04f38',
          600: '#c53b26',
          700: '#9b2b1a',
        }
      }
    },
  },
  plugins: [],
}