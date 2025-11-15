import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import legacy from '@vitejs/plugin-legacy';
import qiankun from 'vite-plugin-qiankun-lite';
import path from 'path';

const HASH = "[hash]";
const MICRO_APP_NAME = "app-profile";

export default defineConfig({
  base: "/",
  plugins: [
    vue(),
    qiankun({
      name: MICRO_APP_NAME,
      sandbox: false
    }),
    legacy({
      targets: ["defaults", "not IE 11"],
      renderLegacyChunks: false,
    }),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
  },
  define: {
    "process.env": "import.meta.env",
  },
  server: {
    port: 8082,
    host: "0.0.0.0",
    origin: "http://localhost:8082",
    headers: {
      "Access-Control-Allow-Origin": "*",
    },
  },
  preview: {
    port: 8082,
    host: "0.0.0.0",
  },
  build: {
    outDir: "dist",
    emptyOutDir: true,
    cssCodeSplit: false,
    rollupOptions: {
      input: path.resolve(__dirname, "src/main.js"),
      output: {
        // format: 'umd',
        // name: MICRO_APP_NAME,
        manualChunks(id) {
          if (id.includes("node_modules")) {
            return "chunk-vendors";
          }
          return undefined;
        },
        entryFileNames: (chunk) =>
          chunk.name === "main" ? `js/app.${HASH}.js` : `js/[name].${HASH}.js`,
        chunkFileNames: `js/[name].${HASH}.js`,
        assetFileNames: (assetInfo) => {
          const ext = path.extname(assetInfo.name || "").slice(1);
          if (ext === "css") {
            return `css/app.${HASH}.css`;
          }
          if (
            ["png", "jpg", "jpeg", "gif", "svg", "webp", "avif"].includes(ext)
          ) {
            return `img/[name].${HASH}[extname]`;
          }
          if (["woff", "woff2", "ttf", "otf", "eot"].includes(ext)) {
            return `fonts/[name].${HASH}[extname]`;
          }
          return `assets/[name].${HASH}[extname]`;
        },
      },
    },
  },
});
