/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        forest: {
          DEFAULT: '#173F35',
          primary: '#173F35',
          secondary: '#285747',
          hover: '#13352C',
          light: '#285747',
          dark: '#0E2721',
        },
        ivory: {
          DEFAULT: '#F7F6F2',
          bg: '#F7F6F2',
          surface: '#FFFFFF',
          muted: '#EFECE6',
        },
        sage: {
          DEFAULT: '#A9B8A5',
          light: '#E5EBE3',
          border: '#D2DDD0',
          dark: '#5C6C58',
        },
        amber: {
          DEFAULT: '#D49A52',
          accent: '#D49A52',
          light: '#FBF2E7',
          dark: '#B87F3B',
        },
        charcoal: {
          DEFAULT: '#242B27',
          text: '#242B27',
          secondary: '#747B73',
          muted: '#8A9289',
        },
        border: {
          DEFAULT: '#E9E7E0',
          focus: '#173F35',
        },
        status: {
          success: '#477A5B',
          warning: '#D49A52',
          danger: '#C66A5A',
        },
      },
      fontFamily: {
        heading: ['Manrope', 'sans-serif'],
        sans: ['Inter', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
