/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        syne: ['Syne', 'sans-serif'],
        grotesk: ['Space Grotesk', 'sans-serif'],
      },
      colors: {
        primary: '#f38b2a', // Orange
        secondary: '#020410', // Fondo header y primera sección
        light: '#faf8f5', // Off-white background
      },
      boxShadow: {
        'soft': '0 4px 20px -2px rgba(0, 0, 0, 0.05)',
        'soft-lg': '0 10px 30px -5px rgba(0, 0, 0, 0.08)',
      },
      animation: {
        fadeIn: 'fadeIn 0.5s ease-in-out',
        marquee: 'marquee 20s linear infinite',
        blob: 'blob 7s infinite',
        // Brillo/latido sutil e infinito para resaltar el aviso del descuento
        // de la clase de prueba.
        'trial-glow': 'trialGlow 2.6s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        trialGlow: {
          '0%, 100%': {
            boxShadow: '0 0 0 0 rgba(243, 139, 42, 0)',
            transform: 'scale(1)',
          },
          '50%': {
            boxShadow: '0 0 0 4px rgba(243, 139, 42, 0.18)',
            transform: 'scale(1.015)',
          },
        },
        marquee: {
          '0%': { transform: 'translateX(0)' },
          '100%': { transform: 'translateX(-50%)' },
        },
        blob: {
          '0%': { transform: 'translate(0px, 0px) scale(1)' },
          '33%': { transform: 'translate(30px, -50px) scale(1.1)' },
          '66%': { transform: 'translate(-20px, 20px) scale(0.9)' },
          '100%': { transform: 'translate(0px, 0px) scale(1)' },
        },
      },
    },
  },
  plugins: [],
}
