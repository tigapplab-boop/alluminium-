import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        alu: {
          bg: '#0B1120',
          surface: '#111827',
          border: '#1F2A3C',
          muted: '#374151',
          text: '#E5E7EB',
          sub: '#9CA3AF',
          accent: '#3B82F6',
          accent2: '#60A5FA',
          success: '#22C55E',
          warning: '#F59E0B',
          danger: '#EF4444',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
    },
  },
  plugins: [],
}

export default config