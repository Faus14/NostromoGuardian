/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'qubic-primary': '#00D4FF',
        'qubic-dark': '#0A0E27',
        'qubic-gray': '#1A1F3A',
      },
    },
  },
  plugins: [],
}
