/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        ivory: '#FAF7F2',
        stone: '#F0EBE1',
        charcoal: '#1C1917',
        terracotta: '#8B3A2B',
      },
    },
  },
  plugins: [],
};
