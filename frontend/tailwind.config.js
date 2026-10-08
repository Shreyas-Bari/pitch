/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        // PITCH UI Spec design tokens (docs/PITCH_UI_SPEC_FINAL.md)
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
          success: '#16A34A',
          warning: '#D97706',
          info: '#0284C7',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        display: ['"Plus Jakarta Sans"', 'Inter', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        'pitch-control': '8px',
        'pitch-card': '16px',
        'pitch-media': '24px',
        'pitch-pill': '9999px',
      },
      boxShadow: {
        'pitch-card': '0 4px 20px -2px rgba(15, 23, 42, 0.06), 0 2px 6px -1px rgba(15, 23, 42, 0.04)',
        'pitch-hover': '0 10px 30px -4px rgba(15, 23, 42, 0.10), 0 4px 10px -2px rgba(15, 23, 42, 0.05)',
        'pitch-dropdown': '0 10px 25px -5px rgba(15, 23, 42, 0.12), 0 8px 10px -6px rgba(15, 23, 42, 0.06)',
        'pitch-glass': '0 8px 32px 0 rgba(15, 23, 42, 0.08)',
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
