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
        // Claude Warm Terracotta Brand Palette
        brand: {
          50:  '#fdf8f5',
          100: '#f9eee8',
          200: '#f2dacd',
          300: '#e8beab',
          400: '#df9c83',
          500: '#da7756', // Primary Claude Terracotta
          600: '#c55d3b',
          700: '#a4472a',
          800: '#873a24',
          900: '#6f3221',
        },
        // Warm Accent — Sand/Amber
        accent: {
          DEFAULT: '#e0966d',
          light:   '#f0cbb5',
          dark:    '#b86940',
        },
        // Warm Charcoal Surface colors (Claude Dark Theme)
        surface: {
          50:  '#faf8f5',
          100: '#f3efe6',
          200: '#e5decb',
          700: '#383632',
          800: '#2e2c29', // Card/Input elevated
          850: '#262522', // Card base
          900: '#1f1e1d', // Sidebar & containers
          950: '#171716', // Main body background
        },
        // Semantic
        success: { DEFAULT: '#34d399', light: '#a7f3d0', dark: '#059669' },
        warning: { DEFAULT: '#fbbf24', light: '#fde68a', dark: '#d97706' },
        danger:  { DEFAULT: '#f87171', light: '#fca5a5', dark: '#dc2626' },
        info:    { DEFAULT: '#60a5fa', light: '#bfdbfe', dark: '#2563eb' },
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
        'glow-sm':  '0 0 12px rgba(218, 119, 86, 0.25)',
        'glow-md':  '0 0 24px rgba(218, 119, 86, 0.35)',
        'glow':     '0 0 20px rgba(218, 119, 86, 0.3)',
        'glow-lg':  '0 0 40px rgba(218, 119, 86, 0.4)',
        'glow-xl':  '0 0 80px rgba(218, 119, 86, 0.25)',
        'card':     '0 4px 24px rgba(0, 0, 0, 0.4)',
        'card-hover': '0 8px 40px rgba(0, 0, 0, 0.6)',
        'glass':    '0 8px 32px rgba(0, 0, 0, 0.45)',
      },
      backgroundImage: {
        'gradient-radial':  'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic':   'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
        'hero-gradient':    'linear-gradient(135deg, #171716 0%, #262522 50%, #1f1e1d 100%)',
        'brand-gradient':   'linear-gradient(135deg, #da7756 0%, #e0966d 100%)',
        'accent-gradient':  'linear-gradient(135deg, #c55d3b 0%, #da7756 100%)',
        'card-gradient':    'linear-gradient(135deg, rgba(38,37,34,0.9) 0%, rgba(31,30,29,0.9) 100%)',
        'mesh-gradient':    'radial-gradient(at 40% 20%, hsla(18,70%,50%,0.08) 0px, transparent 50%), radial-gradient(at 80% 0%, hsla(30,60%,50%,0.06) 0px, transparent 50%), radial-gradient(at 0% 50%, hsla(15,70%,45%,0.06) 0px, transparent 50%)',
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
          '0%, 100%': { boxShadow: '0 0 20px rgba(218, 119, 86, 0.3)' },
          '50%':      { boxShadow: '0 0 40px rgba(218, 119, 86, 0.5)' },
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
