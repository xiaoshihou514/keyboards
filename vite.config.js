import { defineConfig } from 'vite';
import { resolve } from 'node:path';

export default defineConfig(({ command }) => ({
  base: command === 'build' ? '/keyboards/' : '/',
  build: {
    rollupOptions: {
      input: {
        landing: resolve(import.meta.dirname, 'index.html'),
        sofle: resolve(import.meta.dirname, 'demo.html'),
        q11: resolve(import.meta.dirname, 'q11.html'),
        k500: resolve(import.meta.dirname, 'k500.html'),
      },
    },
  },
}));
