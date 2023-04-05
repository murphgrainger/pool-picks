module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx}',
    './components/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['League Spartan', 'sans-serif'],
      },
      colors: {
        transparent: 'transparent',
        green: {
          300: '#B7E3B5',
          500: '#A3DBA0',
          700: '#05762C',
          900: '#034E1E'
        },
        black: '#181818',
        grey: {
          50: '#E6E4E4',
          75: '#7e8599',
          100: '#666B7A',
          200: '#3D4451',
        },
        yellow: '#EDEC32',
      }
    },
  },
  variants: {
    extend: {},
  },
  plugins: [require('@tailwindcss/typography'), require('@tailwindcss/forms')],
};
