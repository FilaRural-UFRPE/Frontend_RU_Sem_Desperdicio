/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        display: ['"Syne"', 'sans-serif'],
        body: ['"DM Sans"', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      colors: {
        ru: {
          blue: '#1a3a8f',
          'blue-light': '#2348b0',
          'blue-dark': '#0f2460',
          'blue-mid': '#1e4db7',
          yellow: '#f5a623',
          'yellow-light': '#fbbf47',
          'yellow-dark': '#d4861a',
          cream: '#f4f6fb',
          'cream-dark': '#e2e8f5',
          charcoal: '#1a1a2e',
          'charcoal-soft': '#2d3561',
          muted: '#64748b',
        },
      },
      animation: {
        'fade-in': 'fadeIn 0.4s ease forwards',
        'slide-up': 'slideUp 0.4s ease forwards',
        'spin-slow': 'spin 2s linear infinite',
      },
      keyframes: {
        fadeIn: { from: { opacity: 0 }, to: { opacity: 1 } },
        slideUp: { from: { opacity: 0, transform: 'translateY(16px)' }, to: { opacity: 1, transform: 'translateY(0)' } },
      },
    },
  },
  plugins: [],
}
