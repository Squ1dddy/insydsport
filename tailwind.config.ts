import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}', './lib/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: '#1A212E', // Softer Dark Gray
        secondary: '#252D3D', // Lighter Gray-Navy
        gold: '#F5C400', // Accent
        textMuted: '#94A3B8', // Soft Gray
        eliminated: '#3A4A5C'
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif']
      },
      boxShadow: {
        card: '0 12px 40px rgba(0, 0, 0, 0.32)'
      },
      animation: {
        scorePop: 'scorePop 220ms ease-out',
        livePulse: 'livePulse 1.6s ease-in-out infinite',
        dotPulse: 'dotPulse 1.2s ease-in-out infinite'
      },
      keyframes: {
        scorePop: {
          '0%': { transform: 'scale(0.92)', opacity: '0.72' },
          '100%': { transform: 'scale(1)', opacity: '1' }
        },
        livePulse: {
          '0%, 100%': { boxShadow: '0 0 0 0 rgba(245, 196, 0, 0.0)' },
          '50%': { boxShadow: '0 0 0 6px rgba(245, 196, 0, 0.12)' }
        },
        dotPulse: {
          '0%, 100%': { transform: 'scale(1)', opacity: '0.8' },
          '50%': { transform: 'scale(1.2)', opacity: '1' }
        }
      }
    }
  },
  plugins: []
};

export default config;
