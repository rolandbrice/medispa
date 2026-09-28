import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';

export default defineConfig({
  site: 'https://medi-spa-saly.sn',
  output: 'static',
  integrations: [tailwind()],
});
