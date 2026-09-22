import { crx } from '@crxjs/vite-plugin';
import { defineConfig } from 'vite';
import manifest from './manifest.config';

export default defineConfig({
  plugins: [crx({ manifest })],
  build: {
    target: 'es2022',
    sourcemap: false,
  },
  // TypeSafeClient reads process.env in Node. The service worker is a
  // browser context, so we pass apiKey explicitly and stub process.
  define: {
    'process.env.TYPESAFE_API_KEY': 'undefined',
    'process.env.TYPESAFE_DEFAULT_MODEL': JSON.stringify('jev-1.13.0'),
  },
});
