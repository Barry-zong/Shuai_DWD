import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  base: './',
  // Disable SPA fallback so every HTML entry resolves directly without looping
  // back to index.html during dev/preview
  appType: 'mpa',
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        screensaver: resolve(__dirname, 'screensaver.html'),
        register: resolve(__dirname, 'register.html'),
        coins: resolve(__dirname, 'coins.html'),
        confirm: resolve(__dirname, 'confirm.html'),
        result: resolve(__dirname, 'result.html'),
        spin: resolve(__dirname, 'spin.html'),
      },
    },
  },
});
