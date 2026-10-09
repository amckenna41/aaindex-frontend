// Quiet Index palette: ink, paper and one signal-blue accent. The default
// gray/indigo scales are remapped so every existing utility lands on-palette;
// the decorative hues collapse onto them. Radius and shadow are flattened.
const ink = {
  50: '#F2F2F0', 100: '#EDEDED', 200: '#E3E3E1', 300: '#CFCFCD', 400: '#A3A3A2',
  500: '#6F6F6E', 600: '#5A5A59', 700: '#3A3A3A', 800: '#242424', 900: '#181818', 950: '#0E0E0E',
}
const signal = {
  50: '#EFF2FF', 100: '#E0E7FF', 200: '#C2CEFF', 300: '#A0B3FF', 400: '#7D98FF',
  500: '#5577FF', 600: '#2F5BFF', 700: '#2449DB', 800: '#1C38AA', 900: '#162A7D', 950: '#0F1C52',
}

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        ink: '#111111', paper: '#FAFAF9',
        gray: ink, slate: ink, zinc: ink, neutral: ink, stone: ink,
        green: ink, emerald: ink, teal: ink, lime: ink, amber: ink, yellow: ink, orange: ink,
        indigo: signal, blue: signal, sky: signal, violet: signal, purple: signal, cyan: signal,
      },
      borderRadius: { DEFAULT: '2px', md: '2px', lg: '2px', xl: '2px', '2xl': '2px', '3xl': '2px' },
      boxShadow: { sm: 'none', DEFAULT: 'none', md: 'none', lg: 'none', xl: 'none', '2xl': 'none', inner: 'none' },
      fontSize: { body: ['15px', '1.75rem'] },
    },
  },
  plugins: [],
}
