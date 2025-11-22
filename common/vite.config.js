// vite.config.ts
import { defineConfig } from 'vite'
import vue from "@vitejs/plugin-vue2";
import path from "path";
import pkg from "./package.json";

export default defineConfig(({ command, mode, ssrBuild }) => {
    console.log("Vite command:", command, "mode:", mode, "ssrBuild:", ssrBuild);
    process.env.NODE_ENV = mode || 'production';
    process.env.VUE_APP_ENV = mode || 'production';
    process.env.ENV_TARGET = 'web';
    process.env.RUNTIME_TARGET = 'web';
    return ({
        plugins: [
            vue(),
        ],
        resolve: {
            conditions: ['browser', 'module', 'default'],
            alias: {
                "@": path.resolve(__dirname, "src"),
            },
        },
        define: {
            "process.env": "import.meta.env",
            ENV_TARGET: JSON.stringify('web'),
            RUNTIME_TARGET: JSON.stringify('web'),
        },
        server: {
            port: 8080,
            host: "0.0.0.0",
            origin: "http://localhost:8080",
            // headers: {
            //     "Access-Control-Allow-Origin": "*",
            //     'Content-Security-Policy':
            //         [
            //             "default-src 'self'",
            //             "script-src 'self'",                // ❌ no 'unsafe-inline', no 'unsafe-eval'
            //             "style-src 'self' 'unsafe-inline'", // ✅ allow inline styles
            //             "img-src 'self' data:",
            //             "connect-src 'self' ws: wss: http://localhost:*",
            //             "object-src 'none'",
            //             "base-uri 'self'",
            //             "frame-ancestors 'self'",
            //         ].join('; '),
            // },
        },
        preview: {
            port: 8080,
            host: "0.0.0.0",
        },
        build: {
            ssr: false,            // make it clear: NO node/ssr build
            target: 'esnext',      // or a modern browser target
            outDir: "dist",
            emptyOutDir: true,
            cssCodeSplit: true,
            rollupOptions: {
                input: path.resolve(__dirname, "index.html"),
                output: {
                    // put all node_modules in "vendor"
                    manualChunks(id) {
                        const excludedPackages = [];
                        const pakageName = id.split("node_modules")
                            .pop()
                            ?.split("/")[1] || pkg.name;
                        if (excludedPackages.includes(pakageName)) {
                            return undefined
                        }
                        if (pakageName === pkg.name) {
                            return `${pakageName}`;
                        }
                        return `vendor/${pakageName}`;
                    },
                    entryFileNames: 'assets/[name].js',
                    chunkFileNames: 'assets/[name].js',
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
                                return `css/vendor/${packageName}[extname]`;
                            }
                            if (['index.css', 'app.css'].includes(assetName)) {
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
    })
});
