/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        background: '#000000',
        foreground: '#ffffff',
        glass: 'rgba(255, 255, 255, 0.03)',
        'glass-border': 'rgba(255, 255, 255, 0.08)',
      },
      fontFamily: {
        sans: ['Inter_400Regular', 'sans-serif'],
        serif: ['PlayfairDisplay_400Regular', 'serif'],
        bold: ['Inter_700Bold', 'sans-serif'],
      }
    },
  },
  plugins: [],
}

