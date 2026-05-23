/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        surface: {
          base: '#0f1117',
          raised: '#181c27',
          overlay: '#1f2433',
          sidebar: '#0c0f18',
        },
        ink: {
          primary: '#eef0f6',
          secondary: '#8b92a9',
          disabled: '#4a5068',
        },
        edge: {
          subtle: '#252b3b',
          default: '#2f3650',
        },
        coral: {
          DEFAULT: '#f4632a',
          deep: '#d44d1a',
        },
        teal: {
          DEFAULT: '#00c896',
        },
        status: {
          success: '#22c55e',
          warning: '#f59e0b',
          error: '#ef4444',
        },
        platform: {
          linkedin: '#0a66c2',
          instagram: '#e1306c',
          twitter: '#1d9bf0',
          tiktok: '#ff0050',
          facebook: '#1877f2',
          youtube: '#ff0000',
        },
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'system-ui', 'sans-serif'],
        display: ['var(--font-jakarta)', 'var(--font-inter)', 'system-ui', 'sans-serif'],
        mono: ['var(--font-jetbrains)', 'ui-monospace', 'monospace'],
      },
      keyframes: {
        'pulse-dot': {
          '0%, 100%': { opacity: '1', transform: 'scale(1)' },
          '50%': { opacity: '0.3', transform: 'scale(0.7)' },
        },
        'slide-up': {
          from: { opacity: '0', transform: 'translateY(6px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        'fade-in': {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
      },
      animation: {
        'pulse-dot': 'pulse-dot 1.5s ease-in-out infinite',
        'slide-up': 'slide-up 0.18s cubic-bezier(0.16, 1, 0.3, 1)',
        'fade-in': 'fade-in 0.15s ease-out',
      },
    },
  },
  plugins: [],
}
