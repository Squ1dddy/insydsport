import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}', './lib/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // "Floodlit Arena" palette — near-black ink, volt-lime brand, hot-flare live red.
        // Legacy tokens (primary/secondary/gold/textMuted/eliminated) are remapped onto
        // the new palette so every existing usage shifts to the new look automatically.
        primary: '#0B0C10', // ink — page background
        secondary: '#181A21', // surface — lifted panels
        surface: '#181A21',
        surface2: '#20232C',
        ink: '#0B0C10',
        line: '#262932', // hairline borders
        volt: '#F4C430', // stadium-gold brand accent (token name kept for stability)
        win: '#F4C430', // winner highlight (used by teamBadgeClass)
        gold: '#F4C430', // alias → brand accent (keeps legacy `gold` usages on-brand)
        flare: '#FF4326', // live / danger red-orange
        bone: '#F4F1E9', // warm off-white text
        ash: '#8B8E98', // muted secondary text
        textMuted: '#8B8E98',
        eliminated: '#454953'
      },
      fontFamily: {
        display: ['Anton', 'Impact', 'sans-serif'],
        sans: ['"Hanken Grotesk"', 'system-ui', 'sans-serif'],
        mono: ['"Spline Sans Mono"', 'ui-monospace', 'monospace']
      },
      boxShadow: {
        card: '0 24px 60px -20px rgba(0, 0, 0, 0.85)',
        volt: '0 0 0 1px rgba(244, 196, 48, 0.5), 0 0 34px -6px rgba(244, 196, 48, 0.45)',
        flare: '0 0 0 1px rgba(255, 67, 38, 0.4), 0 0 30px -6px rgba(255, 67, 38, 0.45)',
        inset: 'inset 0 1px 0 0 rgba(255, 255, 255, 0.05)'
      },
      animation: {
        scorePop: 'scorePop 240ms cubic-bezier(0.22, 1.4, 0.4, 1)',
        livePulse: 'livePulse 1.8s ease-in-out infinite',
        dotPulse: 'dotPulse 1.2s ease-in-out infinite',
        marquee: 'marquee 28s linear infinite',
        floodlight: 'floodlight 9s ease-in-out infinite',
        riseIn: 'riseIn 600ms cubic-bezier(0.16, 1, 0.3, 1) both'
      },
      keyframes: {
        scorePop: {
          '0%': { transform: 'scale(0.7) translateY(4px)', opacity: '0.4' },
          '60%': { transform: 'scale(1.12)' },
          '100%': { transform: 'scale(1)', opacity: '1' }
        },
        livePulse: {
          '0%, 100%': { boxShadow: '0 0 0 0 rgba(255, 67, 38, 0)' },
          '50%': { boxShadow: '0 0 0 5px rgba(255, 67, 38, 0.16)' }
        },
        dotPulse: {
          '0%, 100%': { transform: 'scale(1)', opacity: '0.85' },
          '50%': { transform: 'scale(1.35)', opacity: '1' }
        },
        marquee: {
          from: { transform: 'translateX(0)' },
          to: { transform: 'translateX(-50%)' }
        },
        floodlight: {
          '0%, 100%': { opacity: '0.45', transform: 'translate3d(-3%, 0, 0)' },
          '50%': { opacity: '0.9', transform: 'translate3d(3%, 0, 0)' }
        },
        riseIn: {
          from: { opacity: '0', transform: 'translateY(14px)' },
          to: { opacity: '1', transform: 'translateY(0)' }
        }
      }
    }
  },
  plugins: []
};

export default config;
