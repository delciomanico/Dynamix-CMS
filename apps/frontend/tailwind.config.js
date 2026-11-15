/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      boxShadow: { soft: '0 1px 2px rgba(26,34,51,.04), 0 8px 24px -12px rgba(26,34,51,.10)' },
      colors: { ink: '#1A2233', paper: '#F6F8FB', brand: '#1B3A6B', brandLight: '#4A6FB5', muted: '#6B7487' },
      fontFamily: { sans: ['"DM Sans"', 'sans-serif'], hand: ['Caveat', 'cursive'], mono: ['"DM Mono"', 'monospace'] },
    },
  },
  plugins: [],
};
