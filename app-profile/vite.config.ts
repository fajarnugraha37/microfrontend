import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import legacy from '@vitejs/plugin-legacy';
import path from 'path';

const HASH = '[hash]';

export default defineConfig({
  base: '/',
  plugins: [
    vue(),
    legacy({
      targets: ['defaults', 'not IE 11'],
      renderLegacyChunks: false
    })
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
      vue: '@vue/compat'
    }
  },
  define: {
    'process.env': 'import.meta.env'
  },
  server: {
    port: 8082,
    host: '0.0.0.0',
    origin: 'http://localhost:8082',
    headers: {
      'Access-Control-Allow-Origin': '*'
    }
  },
  preview: {
    port: 8082,
    host: '0.0.0.0'
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    cssCodeSplit: false,
    lib: {
      entry: path.resolve(__dirname, 'src/main.js'),
      name: 'appProfile',
      formats: ['es'],
      fileName: () => 'single-spa-entry.js'
    },
    rollupOptions: {
      output: {
        assetFileNames: (assetInfo) => {
          const ext = path.extname(assetInfo.name || '').slice(1);
          if (ext === 'css') {
            return `css/app.${HASH}.css`;
          }
          if (['png', 'jpg', 'jpeg', 'gif', 'svg', 'webp', 'avif'].includes(ext)) {
            return `img/[name].${HASH}[extname]`;
          }
          if (['woff', 'woff2', 'ttf', 'otf', 'eot'].includes(ext)) {
            return `fonts/[name].${HASH}[extname]`;
          }
          return `assets/[name].${HASH}[extname]`;
        }
      }
    }
  }
});
