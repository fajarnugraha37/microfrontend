import { defineConfig } from "vite";
import legacy from "@vitejs/plugin-legacy";
import { createVuePlugin } from "vite-plugin-vue2";
import path from "path";

const HASH_PLACEHOLDER = "[hash]";

export default defineConfig({
  base: "/",
  plugins: [
    createVuePlugin(),
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
    port: 8080,
    host: "0.0.0.0",
    headers: {
      "Access-Control-Allow-Origin": "*",
    },
  },
  preview: {
    port: 8080,
    host: "0.0.0.0",
  },
  build: {
    outDir: "dist",
    emptyOutDir: true,
    cssCodeSplit: false,
    rollupOptions: {
      output: {
        esModule: false,
        manualChunks(id) {
          if (id.includes("node_modules")) {
            return "chunk-vendors";
          }
          return undefined;
        },
        entryFileNames: (chunk) => {
          if (chunk.name === "main" || chunk.name === "index") {
            return "js/app.js";
          }
          return "js/[name].js";
        },
        chunkFileNames: `js/[name].${HASH_PLACEHOLDER}.js`,
        assetFileNames: (assetInfo) => {
          const ext = path.extname(assetInfo.name || "").slice(1);
          if (ext === "css") {
            // return `css/app.${HASH_PLACEHOLDER}.css`;
            return `css/app.css`;
          }

          if (
            ["png", "jpg", "jpeg", "gif", "svg", "webp", "avif"].includes(ext)
          ) {
            // return `img/[name].${HASH_PLACEHOLDER}[extname]`;
            return `img/[name].[extname]`;
          }

          if (["woff", "woff2", "ttf", "otf", "eot"].includes(ext)) {
            // return `fonts/[name].${HASH_PLACEHOLDER}[extname]`;
            return `fonts/[name].[extname]`;
          }

          // return `assets/[name].${HASH_PLACEHOLDER}[extname]`;
          return `assets/[name].[extname]`;
        },
      },
    },
  },
});
