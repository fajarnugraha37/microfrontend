import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue2";
import legacy from "@vitejs/plugin-legacy";
import path from "path";
import pkg from "./package.json";

export default defineConfig({
    base: "/",
    plugins: [
        vue(),
        legacy({
            targets: ["defaults", "not IE 11"],
            renderLegacyChunks: false,
        }),
        {
            name: 'inject-preload-and-scripts',
            enforce: 'post',
            apply: 'build',
            async transformIndexHtml(html, ctx) {
                const bundle = ctx.bundle;
                if (!bundle) return html;

                // Collect files
                const jsFiles = [];
                const vendorFiles = [];
                const cssFiles = [];
                let entryFiles = [];
                for (const key of Object.keys(bundle)) {
                    const entry = bundle[key];
                    if (!entry.fileName) continue;
                    const fileName = entry.fileName.replace(/\\/g, '/');
                    if (fileName.endsWith('.js')) {
                        jsFiles.push(fileName);
                        if (fileName.startsWith('js/vendor/')) vendorFiles.push(fileName);
                        if (entry.isEntry) entryFiles.push(fileName);
                    }
                    if (fileName.endsWith('.css')) cssFiles.push(fileName);
                }

                // Build preferred vendor order; fallback to alphabetical
                const vendorOrder = [
                    '@babel', '@popperjs', 'axios', 'base64-js', 'bootstrap', 'buffer', 'core-js', 'ieee754', 'import-html-entry', 'isarray', 'lodash', 'mfe-components', 'node-libs-browser', 'path-browserify', 'qiankun', 'single-spa', 'vee-validate', 'vue-loader', 'vue-router', 'vue', 'vuex-persistedstate', 'vuex', 'webpack'
                ];
                // helper to match vendor name portion inside fileName
                function fileMatchesVendor(fileName, vendor) {
                    // vendor names are in file names under `js/vendor/<name>.js`
                    return fileName.includes(`/vendor/${vendor}.js`) || fileName.includes(`/vendor/${vendor}/`);
                }

                // sort vendor files using vendorOrder, with fallback alphabetical
                vendorFiles.sort((a, b) => {
                    const ai = vendorOrder.findIndex(v => fileMatchesVendor(a, v));
                    const bi = vendorOrder.findIndex(v => fileMatchesVendor(b, v));
                    if (ai >= 0 || bi >= 0) {
                        return (ai === -1 ? vendorOrder.length : ai) - (bi === -1 ? vendorOrder.length : bi);
                    }
                    return a.localeCompare(b);
                });

                // Choose the main app chunk (entry). Prefer `js/index.js`, then fallback to first entry
                const appChunk = entryFiles.find(f => f === 'js/index.js' || f === 'js/app.js') || entryFiles[0];

                // Build head preload links
                let headInsert = '';
                // Prioritise app CSS then vendor bootstrap CSS
                const cssApp = cssFiles.find(c => c.includes('/app.css') || c === 'css/app.css');
                const cssBootstrap = cssFiles.find(c => c.includes('/vendor/bootstrap.css') || c.endsWith('bootstrap.css'));
                if (cssApp) headInsert += `<link href="/${cssApp}" rel="preload" as="style" />\n`;
                if (cssBootstrap) headInsert += `<link href="/${cssBootstrap}" rel="preload" as="style" />\n`;
                // Preload vendor JS
                vendorFiles.forEach(v => {
                    headInsert += `<link href="/${v}" rel="preload" as="script" />\n`;
                });
                if (appChunk) headInsert += `<link href="/${appChunk}" rel="preload" as="script" />\n`;

                // Insert CSS stylesheet links near end of head (after preload)
                const styleLinks = [];
                if (cssBootstrap) styleLinks.push(`<link href="/${cssBootstrap}" rel="stylesheet" />`);
                if (cssApp) styleLinks.push(`<link href="/${cssApp}" rel="stylesheet" />`);

                // Build scripts for body: vendor then app
                let bodyScripts = '';
                vendorFiles.forEach(v => {
                    bodyScripts += `<script type="module" crossorigin src="/${v}"></script>\n`;
                });
                if (appChunk) bodyScripts += `<script type="module" crossorigin src="/${appChunk}"></script>\n`;

                // Remove default modulepreload links and the module script tag inserted by Vite
                let newHtml = html.replace(/<link rel="modulepreload"[^>]*>\n?/g, '');
                newHtml = newHtml.replace(/<script[^>]*type="module"[^>]*>\s*<\/script>\n?/g, '');

                // Inject head preload & style links
                newHtml = newHtml.replace('</head>', `${headInsert}${styleLinks.join('\n')}\n</head>`);
                // Inject body scripts
                newHtml = newHtml.replace('</body>', `${bodyScripts}</body>`);

                return newHtml;
            }
        }
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
        origin: "http://localhost:8080",
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
        // Generate source maps for JS and CSS. Set to `true` to create `.map` files
        // or to `'hidden'` to emit them but not reference them from the built files.
        // e.g. use `process.env.GENERATE_SOURCEMAP` or NODE_ENV to control in CI.
        sourcemap: true,
        // Enable CSS splitting so CSS belonging to each vendor chunk can be separated
        cssCodeSplit: true,
        // Produce manifest.json to make it easier to post-process index.html
        manifest: true,
        rollupOptions: {
            // input: path.resolve(__dirname, "src/main.js"),
            input: path.resolve(__dirname, "index.html"),
            output: {
                manualChunks(id, meta) {
                    const pakageName = id.split("node_modules")
                        .pop()
                        ?.split("/")[1] || pkg.name;
                    if (pakageName !== pkg.name) {
                        return `vendor/${pakageName}`;
                    }
                    return `${pakageName}`;
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
        // Post-process the generated `index.html` to create `preload` links and
        // ordered script tags like the webpack output you're expecting. This
        // preserves module behavior (`type=module`) for chunks but generates
        // preload tags with `as="script"`.
        //
        // You can change `vendorOrder` below if you need a specific vendor
        // injection order.
        rollupPluginOptions: {
            // placeholder for potential additional Rollup plugin options
        },
    },

});
