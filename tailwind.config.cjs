/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./index.html', './index.tsx', './App.tsx', './components/**/*.{ts,tsx}', './lib/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Google Sans', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      colors: {
        velocity: {
          black: '#000000',
          red: '#FF1F1F',
          darkRed: '#500a0a',
          grid: '#1F1F1F',
        },
      },
      backgroundImage: {
        'grid-pattern': 'linear-gradient(to right, #1F1F1F 1px, transparent 1px), linear-gradient(to bottom, #1F1F1F 1px, transparent 1px)',
      },
    },
  },
  plugins: [],
};
