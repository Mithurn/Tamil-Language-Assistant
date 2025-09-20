import { defineConfig } from '@tailwindcss/postcss';

export default defineConfig({
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
    "./dist/**/*.html"
  ],
  theme: {
    extend: {
      colors: {
        'tamil-blue': '#667eea',
        'tamil-purple': '#764ba2',
        'dark-bg': '#0f0f0f',
        'dark-card': '#1a1a1a',
        'glow-green': '#00ff88',
        'glow-blue': '#00aaff'
      },
      animation: {
        'glow': 'glow 2s ease-in-out infinite alternate',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'bounce-slow': 'bounce 2s infinite'
      },
      keyframes: {
        glow: {
          '0%': { boxShadow: '0 0 5px #00ff88, 0 0 10px #00ff88, 0 0 15px #00ff88' },
          '100%': { boxShadow: '0 0 10px #00ff88, 0 0 20px #00ff88, 0 0 30px #00ff88' }
        }
      },
      fontFamily: {
        'inter': ['Inter', 'sans-serif']
      }
    },
  },
  plugins: [],
  corePlugins: {
    preflight: false, // Disable Tailwind's base styles to avoid conflicts
  }
});
