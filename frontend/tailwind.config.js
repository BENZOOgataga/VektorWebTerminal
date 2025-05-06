/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      animation: {
        'bounce': 'bounce 1s infinite',
      },
      keyframes: {
        bounce: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-5px)' }
        }
      },
      backdropBlur: {
        'xs': '2px',
      },
      backgroundColor: {
        'glass': 'rgba(255, 255, 255, 0.05)',
        'glass-darker': 'rgba(0, 0, 0, 0.3)',
      },
      boxShadow: {
        'glass': '0 4px 30px rgba(0, 0, 0, 0.1)',
        'glass-inner': 'inset 0 0 5px rgba(255, 255, 255, 0.05)',
      },
      borderColor: {
        'glass': 'rgba(255, 255, 255, 0.1)',
      }
    },
  },
  plugins: [],
}