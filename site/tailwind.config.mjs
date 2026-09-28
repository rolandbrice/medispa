/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        creme: '#F6F1E7',
        sable: '#E9DFCC',
        argile: '#B08D3E',
        dore: '#7A5F16',
        sauge: '#4A3F30',
        encre: '#2B2119',
      },
      fontFamily: {
        serif: ['"Cormorant Garamond"', 'Georgia', 'serif'],
        sans: ['Jost', 'system-ui', 'sans-serif'],
      },
      letterSpacing: { mega: '.35em' },
    },
  },
  plugins: [],
};
