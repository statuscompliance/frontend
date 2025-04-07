import path from 'path';
import { defineConfig } from 'vite';
import UnoCSS from 'unocss/vite';
import react from '@vitejs/plugin-react-swc';
import browserslist from 'browserslist';
import { browserslistToTargets } from 'lightningcss';

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    UnoCSS()
  ],
  resolve: {
    alias: {
      /* global __dirname */
      '@': path.resolve(__dirname, './src'),
    },
  },
  css: {
    lightningcss: {
      targets: browserslistToTargets(browserslist())
    }
  },
});
