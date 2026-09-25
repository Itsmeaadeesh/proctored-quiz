/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        redhat: {
          red: '#EE0000',
          'red-dark': '#C00000',
          'red-darker': '#990000',
          'red-faint': 'rgba(238, 0, 0, 0.08)',
          black: '#151515',
          'black-dark': '#0E0E0E',
          'black-surface': '#1F1F1F',
          gray: {
            light: '#F0F0F0',
            border: '#D2D2D2',
            text: '#6A6E73',
            dark: '#3C3F42',
          },
        },
      },
      fontFamily: {
        display: ['"Red Hat Display"', 'Inter', 'system-ui', 'sans-serif'],
        sans: ['"Red Hat Text"', 'Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
