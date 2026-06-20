export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        pink: {
          50: '#FDF4F5',
          100: '#FAE6E9',
          200: '#F3CDD3',
          300: '#E8A9B2',
          400: '#DB7E8B',
          500: '#C75E6E',
          600: '#A8475A',
          700: '#823643',
          900: '#4A1F28'
        },
        lemon: {
          50: '#F9FBF1',
          100: '#F0F5DC',
          200: '#E1ECB9',
          300: '#CFE091',
          400: '#BBD36C',
          500: '#A3C04C',
          600: '#84A23A',
          700: '#647A2C',
          900: '#3A4719'
        },
        warmgray: {
          50: '#FAF8F7',
          100: '#F2EEEC',
          200: '#E3DCD9',
          300: '#CBC0BC',
          400: '#A99D98',
          500: '#8A7D78',
          600: '#6E625E',
          700: '#564C49',
          800: '#3F3735',
          900: '#2A2422',
          950: '#181412'
        },
      },
      fontFamily: {
        headline: ['Bricolage Grotesque', 'sans-serif'],
        body: ['Hanken Grotesk', 'sans-serif']
      },
      borderRadius: {
        xl: '1.5rem',
        '2xl': '2rem'
      }
    }
  },
  plugins: []
}