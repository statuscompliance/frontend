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
  server: {
    proxy: {
      '/backend': {
        // eslint-disable-next-line
        target: process.env.VITE_BASE_URL || 'http://127.0.0.1:3001/api/v1',
        changeOrigin: true,
        rewrite: path => path.replace(/^\/backend/, '')
      },
      '/node-red': {
        // eslint-disable-next-line
        target: process.env.VITE_NODE_RED_URL || 'http://127.0.0.1:1880',
        changeOrigin: true
      },
      '/grafana': {
        // eslint-disable-next-line
        target: process.env.VITE_GRAFANA_URL || 'http://127.0.0.1:3100',
        changeOrigin: true,
        // rewrite: path => path.replace(/^\/grafana/, '')
      }
    }
  }
});
