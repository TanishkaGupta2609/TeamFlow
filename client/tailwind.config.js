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
          light: '#235043',
          dark: '#0E2721',
          50: '#F0F5F2',
          100: '#DCE7E2',
        },
        ivory: {
          DEFAULT: '#F7F6F2',
          bg: '#F7F6F2',
          surface: '#FFFFFF',
          muted: '#EFECE6',
          subtle: '#FAF9F6',
        },
        sage: {
          DEFAULT: '#A9B8A5',
          light: '#E8EFE6',
          border: '#D2DDD0',
          dark: '#5E6F5A',
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
          dark: '#D8D5CD',
          focus: '#173F35',
        },
        status: {
          success: '#477A5B',
          successBg: '#EBF3EE',
          warning: '#D49A52',
          warningBg: '#FAF3EA',
          danger: '#C66A5A',
          dangerBg: '#F8ECE9',
        },
      },
      fontFamily: {
        heading: ['Manrope', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      boxShadow: {
        subtle: '0 1px 2px 0 rgba(36, 43, 39, 0.04)',
        card: '0 2px 4px 0 rgba(36, 43, 39, 0.05), 0 1px 2px -1px rgba(36, 43, 39, 0.05)',
        elevated: '0 6px 12px -2px rgba(36, 43, 39, 0.08), 0 3px 6px -3px rgba(36, 43, 39, 0.06)',
      },
      borderRadius: {
        card: '8px',
        btn: '6px',
        input: '6px',
      },
    },
  },
  plugins: [],
};
