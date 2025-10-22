/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class', // ✅ Add this line to enable `dark:` variants
  theme: {
    extend: {
      fontFamily: {
        sans: ['Nunito', 'sans-serif'],
      },
      fontSize: {
        'custom-sm': '0.813rem',
      },
        colors: {
        gray: {
          900: '#19191c',
          800: '#1f1f23',
          700: '#2a2a2f',
          600: '#35353b',
        }
      }
    },
  },
  plugins: [],
};
