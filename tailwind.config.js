module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx}',
    './components/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        transparent: 'transparent',
        green: '#A3DBA0',
        black: '#181818',
        grey: {
          50: '#E6E4E4',
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
