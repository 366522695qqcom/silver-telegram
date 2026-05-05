/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#007aff',
        background: '#f5f5f7',
        surface: '#ffffff',
      },
      borderRadius: {
        apple: '12px',
      },
      boxShadow: {
        apple: '0 2px 8px rgba(0,0,0,0.08)',
      },
    },
  },
  plugins: [],
}
