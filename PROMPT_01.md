# Migration Prompt Template (Vue CLI → Vite, Qiankun Microfrontend)

```
You are migrating a Vue 2 microfrontend that currently relies on Vue CLI (webpack) to a Vite-based build, without breaking any Qiankun integrations or downstream consumers that hard-link asset filenames.

Goals:
- Swap `vue.config.js` for `vite.config.ts` while preserving Vue CLI-style hashed outputs (`/js/app.[hash].js`, `/js/chunk-vendors.[hash].js`, `/css/app.[hash].css`, plus `img/` and `fonts/` directories).
- Keep the same base URL and dev server behaviour (ports, CORS headers, Qiankun host expectations).
- Maintain Vue 2 runtime, Vue Router, Vuex, and Qiankun lifecycles; integrate `vite-plugin-qiankun` with `useDevMode = true`.
- Ensure entry HTML matches the original structure (`<div id="app"></div>`, meta tags, title).
- Update package scripts to `vite` equivalents and add necessary devDependencies (Vite 4.x, `vite-plugin-vue2`, `vite-plugin-qiankun`, `@vitejs/plugin-legacy`, Babel, ESLint).
- Replace the Vue CLI Babel preset with `@babel/preset-env` (transform-only mode) and rely on `@vitejs/plugin-legacy` for polyfills.
- Remove webpack-specific globals (like `__webpack_public_path__`) from entry code; Vite + Qiankun handle public-path injection.
- Add a migration report summarising before/after build shapes, configuration changes, install/run commands, and any compatibility shims (e.g., `globalThis.File` polyfill for older Node runtimes).

Required deliverables:
1. `vite.config.ts` with manual chunking, cssCodeSplit=false, assetFileNames, `@` alias, process.env shim, Qiankun plugin, and Vite legacy plugin.
2. Root-level `index.html` that mirrors the Vue CLI template and loads `/src/main.js`.
3. Updated `package.json` (scripts + dependencies) and `babel.config.js`.
4. Migration report documenting the changes, verification checklist, and any install workarounds.
5. Ensure the project builds (`npm run build`) to Vue CLI-compatible artifact names and runs locally under Qiankun (`npm run dev`).
```
