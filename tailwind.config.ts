import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        mono: ['var(--font-mono)', 'ui-monospace', 'SFMono-Regular', 'monospace'],
      },
      colors: {
        retro: {
          bg: '#26262E',
          surface: '#2F2F38',
          surface2: '#383841',
          border: '#3F3F4A',
          text: '#E6E6EA',
          muted: '#9A9AA5',
          dim: '#6B6B76',
          accent: '#FFA24C',
          'accent-hover': '#FFB36B',
          coral: '#FF6B4A',
          pink: '#E957C5',
          purple: '#9D7BFF',
          danger: '#FF5C5C',
        },
      },
      backgroundImage: {
        'retro-gradient': 'linear-gradient(90deg, #FF6B4A 0%, #E957C5 50%, #9D7BFF 100%)',
        'avatar-gradient': 'linear-gradient(135deg, #9D7BFF 0%, #E957C5 100%)',
      },
      animation: {
        'pulse-slow': 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'fade-in': 'fadeIn 0.3s ease-in-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(4px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [],
};

export default config;
