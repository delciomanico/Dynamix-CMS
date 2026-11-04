/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: { ink: '#1A2233', paper: '#F6F8FB', brand: '#1B3A6B', brandLight: '#4A6FB5', muted: '#6B7487' },
      fontFamily: { sans: ['"DM Sans"', 'sans-serif'], hand: ['Caveat', 'cursive'], mono: ['"DM Mono"', 'monospace'] },
    },
  },
  plugins: [],
};
