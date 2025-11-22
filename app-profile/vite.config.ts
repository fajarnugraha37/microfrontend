import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import { federation } from "@module-federation/vite";
import qiankun from "vite-plugin-qiankun-lite";
import path from "path";
import pkg from "./package.json";

const config = {
  production: {
    base: "/",
  },
  default: {
    base: "http://localhost:8082/",
  },
};

export default defineConfig(() => {
  return {
    // Use absolute base so chunk asset URLs resolve to remote origin when consumed by a host (prevents host origin 8080 rewrites)
    base: "http://localhost:8082/",
    plugins: [
      vue({
        template: {
          compilerOptions: {
            compatConfig: { MODE: 2 },
          },
        },
      }),
      qiankun({
        name: pkg.name,
      }),
      federation({
        name: pkg.name,
        filename: "remoteEntry.js",
        manifest: true,
        dev: true,
        exposes: {
          "./entry": "./src/entry.js",
        },
        shared: [
          "mfe-components"
        ],
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
      headers: { "Access-Control-Allow-Origin": "*" },
    },
    preview: { port: 8082, host: "0.0.0.0" },
    build: {
      target: "esnext",
      outDir: "dist",
      emptyOutDir: true,
      cssCodeSplit: true,
      rollupOptions: {
        input: path.resolve(__dirname, "index.html"),
        output: {
          // manualChunks(id) {
          //   const excludedPackages = ["mfe-components"];
          //   const pakageName =
          //     id.split("node_modules").pop()?.split("/")[1] || pkg.name;
          //   if (excludedPackages.includes(pakageName)) {
          //     return undefined;
          //   }
          //   if (pakageName === pkg.name) {
          //     return `${pakageName}`;
          //   }
          //   return `vendor/${pakageName}`;
          // },
          entryFileNames: (chunk) =>
            chunk.name === "main" ? `js/${pkg.name}.js` : `js/[name].js`,
          chunkFileNames: `js/[name].js`,
          assetFileNames: (assetInfo) => {
            const ext = path.extname(assetInfo.name || "").slice(1);
            if (ext === "css") {
              // The asset name sometimes contains the full import path including node_modules
              const assetName = (assetInfo.name || "").replace(/\\/g, "/");
              // If this CSS comes from node_modules, try to extract the package name
              if (assetName.includes("node_modules/")) {
                const pathAfterNodeModules =
                  assetName.split("node_modules/")[1] || "";
                const pathParts = pathAfterNodeModules.split("/");
                let packageName = pathParts[0];
                // Support scoped packages like @scope/pkg
                if (
                  packageName &&
                  packageName.startsWith("@") &&
                  pathParts[1]
                ) {
                  packageName = `${packageName}/${pathParts[1]}`;
                }
                // Put vendor CSS into a vendor folder, name per package + hash to avoid conflicts
                return `css/vendor/${packageName}[extname]`;
              }
              if (["index.css", "app.css"].includes(assetName)) {
                return `css/${pkg.name}[extname]`;
              }

              return `css/vendor/[name][extname]`;
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
  };
});
