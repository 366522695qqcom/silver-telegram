/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'apple-white': '#ffffff',
        'apple-gray-bg': '#f5f5f7',
        'apple-gray-light': '#fbfbfd',
        'apple-blue': '#0071e3',
        'apple-blue-hover': '#0077ed',
        'apple-blue-subtle': '#e8f4fd',
        'apple-text': '#1d1d1f',
        'apple-text-secondary': '#6e6e73',
        'apple-text-tertiary': '#86868b',
        'apple-border': '#d2d2d7',
        'apple-border-light': '#e5e5ea',
        'apple-success': '#34c759',
        'apple-warning': '#ff9500',
        'apple-error': '#ff3b30',
      },
      fontFamily: {
        'sf': ['-apple-system', 'BlinkMacSystemFont', 'PingFang SC', 'Hiragino Sans GB', 'Segoe UI', 'Roboto', 'Helvetica', 'Arial', 'sans-serif'],
        'mono': ['SF Mono', 'Menlo', 'Monaco', 'Consolas', 'monospace'],
      },
      borderRadius: {
        'apple-sm': '8px',
        'apple-md': '12px',
        'apple-lg': '16px',
      },
      boxShadow: {
        'apple-subtle': '0 1px 3px rgba(0,0,0,0.04)',
        'apple-card': '0 2px 8px rgba(0,0,0,0.06)',
        'apple-card-hover': '0 4px 16px rgba(0,0,0,0.08)',
        'apple-modal': '0 8px 32px rgba(0,0,0,0.12)',
      },
      animation: {
        'apple-fade-in': 'appleFadeIn 0.3s ease-out',
        'apple-slide-up': 'appleSlideUp 0.3s ease-out',
        'apple-pulse-subtle': 'applePulseSubtle 2s ease-in-out infinite',
      },
      keyframes: {
        appleFadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        appleSlideUp: {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        applePulseSubtle: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.7' },
        },
      },
    },
  },
  plugins: [],
}
