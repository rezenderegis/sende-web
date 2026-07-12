/**
 * SENDE — Cores para Tailwind CSS
 * Se o sistema usa Tailwind: mesclar este objeto em tailwind.config.js
 * dentro de theme.extend. Aí as classes ficam: bg-teal-600, text-coral, etc.
 * (Tailwind v4: declarar via @theme no CSS usando os mesmos valores.)
 */
module.exports = {
  theme: {
    extend: {
      colors: {
        teal: {
          50:  '#F0FDFA',
          100: '#CCFBF1',
          500: '#14B8A6',
          600: '#0D9488',
          700: '#0F766E',
          900: '#134E4A',
        },
        coral: {
          DEFAULT: '#F97316',
          hover:   '#EA6A0C',
          soft:    '#FFEDD5',
        },
        ink: {
          DEFAULT: '#1E293B',
          soft:    '#475569',
          faint:   '#94A3B8',
        },
      },
      fontFamily: {
        display: ['Sora', 'system-ui', 'sans-serif'],
        body:    ['Inter', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        card: '20px',
        pill: '999px',
      },
      boxShadow: {
        sende:      '0 12px 40px rgba(19,78,74,.10)',
        'sende-sm': '0 4px 20px rgba(19,78,74,.05)',
      },
    },
  },
};
