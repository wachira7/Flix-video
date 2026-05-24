/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{ts,tsx}', './App.tsx', './index.js'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#9333EA',
          foreground: '#FFFFFF',
        },
        accent: {
          DEFAULT: '#DB2777',
          foreground: '#FFFFFF',
        },
        background: '#111318',
        foreground: '#F8FAFC',
        card: {
          DEFAULT: '#16191F',
          foreground: '#F8FAFC',
        },
        secondary: {
          DEFAULT: '#1E2229',
          foreground: '#F8FAFC',
        },
        muted: {
          DEFAULT: '#1E2229',
          foreground: '#8A9AB5',
        },
        border: '#282E38',
        input: '#282E38',
        ring: '#9333EA',
        destructive: {
          DEFAULT: '#EF4444',
          foreground: '#FFFFFF',
        },
        success: '#46D369',
        warning: '#FFA00A',
      },
      fontFamily: {
        sans: ['System'],
      },
    },
  },
  plugins: [],
};
