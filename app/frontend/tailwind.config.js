/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'system-ui', 'sans-serif'],
        display: ['Outfit', 'system-ui', 'sans-serif'],
      },
      colors: {
        binder: {
          950: '#070A11',
          900: '#0B0F19',
          800: '#131B2B',
          700: '#1C263D',
          600: '#273554',
          500: '#384B75',
        },
      },
      boxShadow: {
        card: '0 8px 24px -4px rgba(0, 0, 0, 0.5)',
        'card-hover': '0 20px 35px -6px rgba(99, 102, 241, 0.25)',
        foil: '0 0 25px 2px rgba(245, 158, 11, 0.3)',
      },
    },
  },
  plugins: [],
}
