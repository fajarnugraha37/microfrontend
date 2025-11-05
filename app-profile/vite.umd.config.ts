import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import path from 'path';

const HASH = '[hash]';

export default defineConfig({
  base: '/',
  plugins: [
    vue()
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
  build: {
    outDir: 'dist-umd',
    emptyOutDir: false,
    cssCodeSplit: false,
    sourcemap: false,
    rollupOptions: {
      input: path.resolve(__dirname, 'src/main.js'),
      output: {
        format: 'umd',
        name: 'appProfile',
        exports: 'auto',
        inlineDynamicImports: true,
        entryFileNames: () => `js/app.${HASH}.js`,
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
