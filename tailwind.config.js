import { defineConfig } from '@tailwindcss/vite'

export default defineConfig({
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: '#1A1A2E',
        text: '#E8E8E8',
        success: '#00FF00',
        focus: '#FFFF00',
        danger: '#FF4444',
        info: '#44CCFF',
        warning: '#FF8800',
        meta: '#8844FF',
        disabled: '#666666',
      },
      fontFamily: {
        mono: ['Courier New', 'Consolas', 'IBM Plex Mono', 'monospace'],
      },
      spacing: {
        '0.5ch': '0.5ch',
        '1ch': '1ch',
        '2ch': '2ch',
        '4ch': '4ch',
        '8ch': '8ch',
      },
    },
  },
})