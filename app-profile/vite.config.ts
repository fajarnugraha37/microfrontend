import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import legacy from "@vitejs/plugin-legacy";
import qiankun from "vite-plugin-qiankun-lite";
import path from "path";
import pkg from "./package.json";

export default defineConfig({
  base: "/",
  plugins: [
    vue({
      template: {
        compilerOptions: {
          compatConfig: {
            MODE: 2,
          },
        },
      },
    }),
    qiankun({
      name: pkg.name,
      sandbox: false,
    }),
    legacy({
      targets: ["defaults", "not IE 11"],
      renderLegacyChunks: false,
    }),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
      vue: "@vue/compat",
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
    // Enable CSS splitting so CSS belonging to each vendor chunk can be separated
    cssCodeSplit: true,
    rollupOptions: {
      // input: path.resolve(__dirname, "src/main.js"),
      input: path.resolve(__dirname, "index.html"),
      output: {
        manualChunks(id, meta) {
          const pakageName = id.split("node_modules")
            .pop()
            ?.split("/")[1] || pkg.name;
          if (pakageName === "mfe-components") {
            return undefined
          }
          if (pakageName === pkg.name) {
            return `${pakageName}-${Date.now()}`;
          }
          return `vendor/${pakageName}`;
        },
        entryFileNames: (chunk) =>
          chunk.name === "main" ? `js/app.js` : `js/[name].js`,
        chunkFileNames: `js/[name].js`,
        assetFileNames: (assetInfo) => {
          const ext = path.extname(assetInfo.name || "").slice(1);
          if (ext === "css") {
            // The asset name sometimes contains the full import path including node_modules
            const assetName = (assetInfo.name || "").replace(/\\/g, '/');
            // If this CSS comes from node_modules, try to extract the package name
            if (assetName.includes('node_modules/')) {
              const pathAfterNodeModules = assetName.split('node_modules/')[1] || '';
              const pathParts = pathAfterNodeModules.split('/');
              let packageName = pathParts[0];
              // Support scoped packages like @scope/pkg
              if (packageName && packageName.startsWith('@') && pathParts[1]) {
                packageName = `${packageName}/${pathParts[1]}`;
              }
              // Put vendor CSS into a vendor folder, name per package + hash to avoid conflicts
              return `css/vendor/${packageName}.[hash][extname]`;
            }
            if (['index.css', 'app.css'].includes(assetName)) {
              return `css/${pkg.name}.[hash][extname]`;
            }

            return `css/vendor/[name].[hash][extname]`;
          }
          if (
            ["png", "jpg", "jpeg", "gif", "svg", "webp", "avif"].includes(ext)
          ) {
            return `img/[name][extname]`;
          }
          if (["woff", "woff2", "ttf", "otf", "eot"].includes(ext)) {
            return `fonts/[name][extname]`;
          }
          return `assets/[name][extname]`;
        },
      },
    },
  },
});
