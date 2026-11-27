import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        ivory: '#FAF7F2',
        stone: '#F0EBE1',
        cream: '#E7E0D3',
        charcoal: '#1C1917',
        terracotta: '#8B3A2B',
        maroon: '#6B221B',
        gold: '#B08D57',
      },
      fontFamily: {
        serif: ['var(--font-serif)', 'Georgia', 'serif'],
        sans: ['var(--font-sans)', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};

export default config;
