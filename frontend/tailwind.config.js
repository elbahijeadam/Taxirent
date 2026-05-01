/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#fff5f5',
          100: '#fed7d7',
          500: '#e53e3e',
          600: '#c53030',
          700: '#9b2c2c',
        },
        dark: {
          900: '#1a1a2e',
          800: '#16213e',
          700: '#0f3460',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
