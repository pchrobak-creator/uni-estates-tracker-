/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        green: {
          DEFAULT: '#1D9E75',
          light: '#E1F5EE',
          dark: '#0F6E56',
        },
        coral: '#D85A30',
        amber: '#BA7517',
        bg: '#F7F6F2',
        surface: '#FFFFFF',
        text: { DEFAULT: '#1A1A18', 2: '#5A5A55', 3: '#9A9A94' },
      },
      borderRadius: { DEFAULT: '12px' },
      fontFamily: {
        sans: ['"DM Sans"', 'sans-serif'],
        mono: ['"DM Mono"', 'monospace'],
      },
    },
  },
  plugins: [],
};
