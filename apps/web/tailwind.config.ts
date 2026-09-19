import type { Config } from 'tailwindcss'

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#0C6B6B',
          dark: '#095454',
          light: '#E8F4F4',
        },
        accent: {
          DEFAULT: '#F5A623',
          light: '#FEF3DC',
        },
        surface: '#FFFFFF',
        bg: '#F7F9F9',
        text: {
          1: '#1A2E2E',
          2: '#4A6060',
          3: '#8AABAB',
        },
      },
      fontFamily: {
        fraunces: ['Fraunces', 'Georgia', 'serif'],
        sans: ['DM Sans', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
} satisfies Config
