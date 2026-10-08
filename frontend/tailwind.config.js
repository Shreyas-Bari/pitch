/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        // PITCH UI Spec design tokens (Section 3)
        pitch: {
          canvas: '#F8F9FF',
          surface: '#FFFFFF',
          'surface-1': '#EFF4FF',
          'surface-2': '#E5EEFF',
          'surface-3': '#DCE9FF',
          'surface-4': '#D3E4FE',
          text: '#0B1C30',
          muted: '#45464D',
          outline: '#76777D',
          'outline-variant': '#C6C6CD',
          navy: '#0F172A',
          blue: '#2563EB',
          'blue-hover': '#3B82F6',
          error: '#BA1A1A',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['"Plus Jakarta Sans"', 'Inter', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        'pitch-control': '8px',
        'pitch-card': '16px',
        'pitch-media': '24px',
        'pitch-pill': '9999px',
      },
      spacing: {
        'pitch-xs': '4px',
        'pitch-sm': '8px',
        'pitch-md': '16px',
        'pitch-lg': '24px',
        'pitch-xl': '40px',
      },
    },
  },
  plugins: [],
};
