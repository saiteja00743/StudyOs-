/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        // Brand palette — deep space + electric violet
        brand: {
          50:  '#f0edff',
          100: '#e2dbff',
          200: '#c5b7ff',
          300: '#a793ff',
          400: '#8a6fff',
          500: '#6d4bff', // Primary
          600: '#5a3ce6',
          700: '#472dcc',
          800: '#341eb3',
          900: '#210f99',
        },
        // Accent — electric indigo/blue
        accent: {
          DEFAULT: '#818cf8',
          light:   '#c7d2fe',
          dark:    '#4f46e5',
        },
        // Surface colors for dark mode
        surface: {
          50:  '#f8f9ff',
          100: '#eef0fa',
          200: '#dde1f5',
          800: '#1a1d2e',
          850: '#141627',
          900: '#0e1020',
          950: '#080a16',
        },
        // Semantic
        success: { DEFAULT: '#22c55e', light: '#86efac', dark: '#15803d' },
        warning: { DEFAULT: '#f59e0b', light: '#fcd34d', dark: '#b45309' },
        danger:  { DEFAULT: '#ef4444', light: '#fca5a5', dark: '#b91c1c' },
        info:    { DEFAULT: '#3b82f6', light: '#93c5fd', dark: '#1d4ed8' },
      },
      fontFamily: {
        sans:  ['Inter', 'system-ui', 'sans-serif'],
        mono:  ['JetBrains Mono', 'Fira Code', 'monospace'],
        display: ['Outfit', 'Inter', 'sans-serif'],
      },
      fontSize: {
        '2xs': ['0.625rem', { lineHeight: '1rem' }],
      },
      borderRadius: {
        '4xl': '2rem',
        '5xl': '2.5rem',
      },
      boxShadow: {
        'glow-sm':  '0 0 10px rgba(109, 75, 255, 0.25)',
        'glow-md':  '0 0 24px rgba(109, 75, 255, 0.4)',
        'glow':     '0 0 20px rgba(109, 75, 255, 0.35)',
        'glow-lg':  '0 0 40px rgba(109, 75, 255, 0.45)',
        'glow-xl':  '0 0 80px rgba(109, 75, 255, 0.3)',
        'card':     '0 4px 24px rgba(0, 0, 0, 0.3)',
        'card-hover': '0 8px 40px rgba(0, 0, 0, 0.5)',
        'glass':    '0 8px 32px rgba(0, 0, 0, 0.37)',
      },
      backgroundImage: {
        'gradient-radial':  'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic':   'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
        'hero-gradient':    'linear-gradient(135deg, #080a16 0%, #1a1d2e 40%, #0e1020 100%)',
        'brand-gradient':   'linear-gradient(135deg, #6d4bff 0%, #818cf8 100%)',
        'accent-gradient':  'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
        'card-gradient':    'linear-gradient(135deg, rgba(26,29,46,0.8) 0%, rgba(14,16,32,0.8) 100%)',
        'mesh-gradient':    'radial-gradient(at 40% 20%, hsla(265,80%,50%,0.15) 0px, transparent 50%), radial-gradient(at 80% 0%, hsla(230,80%,60%,0.1) 0px, transparent 50%), radial-gradient(at 0% 50%, hsla(280,80%,50%,0.1) 0px, transparent 50%)',
      },
      animation: {
        'fade-in':       'fadeIn 0.5s ease-in-out',
        'fade-up':       'fadeUp 0.6s ease-out',
        'slide-in-left': 'slideInLeft 0.5s ease-out',
        'float':         'float 6s ease-in-out infinite',
        'pulse-glow':    'pulseGlow 2s ease-in-out infinite',
        'shimmer':       'shimmer 2s linear infinite',
        'spin-slow':     'spin 8s linear infinite',
        'bounce-slow':   'bounce 3s infinite',
        'gradient-shift':'gradientShift 8s ease infinite',
      },
      keyframes: {
        fadeIn: {
          '0%':   { opacity: '0' },
          '100%': { opacity: '1' },
        },
        fadeUp: {
          '0%':   { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideInLeft: {
          '0%':   { opacity: '0', transform: 'translateX(-20px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%':      { transform: 'translateY(-20px)' },
        },
        pulseGlow: {
          '0%, 100%': { boxShadow: '0 0 20px rgba(109, 75, 255, 0.35)' },
          '50%':      { boxShadow: '0 0 40px rgba(109, 75, 255, 0.65)' },
        },
        shimmer: {
          '0%':   { backgroundPosition: '-1000px 0' },
          '100%': { backgroundPosition: '1000px 0' },
        },
        gradientShift: {
          '0%, 100%': { backgroundPosition: '0% 50%' },
          '50%':      { backgroundPosition: '100% 50%' },
        },
      },
      backdropBlur: {
        xs: '2px',
      },
    },
  },
  plugins: [],
};
