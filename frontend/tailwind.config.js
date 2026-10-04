/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        dark: {
          950: '#040711',
          900: '#070d1e',
          850: '#0c142b',
          800: '#111b38',
          700: '#1a294f',
          600: '#263b6e',
        },
        cyan: {
          glow: '#00f0ff',
          neon: '#00e5ff',
          dim: '#0284c7',
        },
        border: 'rgba(30, 41, 59, 0.8)',
      },
      fontFamily: {
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'cyan-glow': '0 0 25px -5px rgba(0, 240, 255, 0.3)',
        'cyan-sm': '0 0 10px rgba(0, 240, 255, 0.25)',
        'card-dark': '0 8px 32px 0 rgba(0, 0, 0, 0.37)',
      },
      backgroundImage: {
        'grid-pattern': "radial-gradient(rgba(0, 240, 255, 0.08) 1px, transparent 1px)",
      },
      animation: {
        'pulse-subtle': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'scanline': 'scan 8s linear infinite',
      },
      keyframes: {
        scan: {
          '0%': { transform: 'translateY(-100%)' },
          '100%': { transform: 'translateY(1000%)' },
        }
      }
    },
  },
  plugins: [],
}
