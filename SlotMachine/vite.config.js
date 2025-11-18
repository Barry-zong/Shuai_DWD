import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        screensaver: resolve(__dirname, 'screensaver.html'),
        register: resolve(__dirname, 'register.html'),
        coins: resolve(__dirname, 'coins.html'),
        confirm: resolve(__dirname, 'confirm.html'),
        spin: resolve(__dirname, 'spin.html'),
        result: resolve(__dirname, 'result.html'),
      },
    },
  },
});
