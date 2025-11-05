# Vite Migration Summary

## Overview

- **Source toolchain:** Vue CLI 4 (webpack) with `vue.config.js` defining Qiankun-friendly UMD output.
- **Target toolchain:** Vite 4.5 + `@vitejs/plugin-vue` with Vue 3 compat (`@vue/compat`) and Qiankun lifecycle exports.
- **Goal:** Keep downstream consumers that hard-link `/js/app.[hash].js` and `/js/chunk-vendors.[hash].js` working while modernising the build.

## Key Changes

| Area | Before | After |
| --- | --- | --- |
| Bundler | `vue-cli-service` (webpack) | `vite@4` (Rollup) |
| Scripts | `npm run serve`, `vue-cli-service build` | `npm run dev`, `vite build`, `vite preview` |
| Config | `vue.config.js` | `vite.config.ts` (+ `vite-plugin-qiankun` & Vue 3 compat alias) |
| Output style | Vue CLI hash pattern | Custom Vite Rollup config mirroring `/js/app.[hash].js`, `/js/chunk-vendors.[hash].js`, `/css/app.[hash].css` |
| Dev server | webpack-dev-server @ 8082 | Vite dev server @ 8082 with identical CORS headers |
| Env access | implicit `process.env` shim | `define: { 'process.env': 'import.meta.env' }` |
| State | Vuex 3 instance | Vuex 4 store created per mount (Vue 3 compatible) |
| Babel | `@vue/cli-plugin-babel/preset` | `@babel/preset-env` (ES-only transforms; rely on Vite legacy plugin for polyfills) |

## Output Layout

Running `npm run build` yields:

```
dist/
├─ index.html
├─ js/
│  ├─ app.[hash].js
│  ├─ chunk-vendors.[hash].js
│  └─ [async-chunk].[hash].js
├─ css/
│  └─ app.[hash].css
├─ img/
│  └─ [asset].[hash].[ext]
└─ fonts/
   └─ [font].[hash].[ext]
```

This matches the Vue CLI contract so Qiankun registrations that fetch `/js/app.*` continue to succeed.

## Configuration Notes

- `base` remains `/`, mirroring the production `publicPath`.
- `server.origin` is set to `http://localhost:8082` so dev-mode assets resolve exactly as before; CORS header unchanged.
- `cssCodeSplit: false` guarantees a single CSS bundle (`css/app.[hash].css`).
- Manual Rollup chunks funnel all node_modules into `chunk-vendors`; async imports continue to emit under `js/[name].[hash].js`.
- Output format is `umd` to match Qiankun expectations; `vite-plugin-qiankun` handles runtime glue and HMR in dev (`useDevMode: true`).
- Vite is pinned to the 4.x line to stay compatible with environments lacking the global `File` constructor (Node < 18).
- `vite.config.ts` polyfills `globalThis.File` when absent so Undici (used by Vite) does not crash on older Node versions.
- Alias `@ → src` and `vue → @vue/compat` ensure Vue 3 compat is used everywhere.
- Vuex store now uses `createStore` from Vuex 4 and is instantiated per mount to avoid cross-qiankun contamination.
- Babel preset now runs in transform-only mode (no `core-js` runtime); legacy polyfills are injected by `@vitejs/plugin-legacy`.
- Removed the old `__webpack_public_path__` guard from `src/main.js`; Vite + `vite-plugin-qiankun` handle public path injection automatically.
- Added `COMPAT_PLAN.md` to track active compat rules, warnings, and follow-up work.
- Compat flags currently enabled: `MODE`, `GLOBAL_MOUNT`, `GLOBAL_EXTEND`, `GLOBAL_PROTOTYPE`, `INSTANCE_SCOPED_GLOBALS`, `ATTR_FALSE_VALUE`, `INSTANCE_LISTENERS`, `COMPONENT_V_MODEL`, `RENDER_FUNCTION`.
- Known console warnings: Vue compat `RENDER_FUNCTION`, `INSTANCE_LISTENERS`, and Qiankun `initGlobalState` deprecation (documented in `COMPAT_PLAN.md`).

## Commands

```bash
# Install (npm 10 on Windows may need the legacy flag)
npm install --legacy-peer-deps

# Start dev server (port 8082, HMR)
npm run dev

# Build for production (dist/ with Vue CLI-like filenames)
npm run build

# Preview the production build locally
npm run preview

# Lint Vue/JS sources
npm run lint
```

## Verification Checklist

1. `npm run build` → inspect `dist/index.html`, ensure it references `/js/app.[hash].js` and `/css/app.[hash].css`.
2. `npm run dev` → load `http://localhost:8082` via the shell; Qiankun should register and mount the profile app normally.
3. Validate that remote asset URLs (e.g., `/js/chunk-vendors.*`) match any downstream expectations or CDN rules.
4. Confirm `css/app.[hash].css` is the only emitted stylesheet.
5. Optional: if consumers expect additional aliases/filenames, add them via a post-build copy hook (not required now).

## Suggested Prompt for Future Vite Migrations

```
You are upgrading a Vue 2 microfrontend from Vue CLI to Vite. Preserve Vue CLI-style hashed filenames (/js/app.[hash].js, /js/chunk-vendors.[hash].js, single /css/app.[hash].css, img/ and fonts/ folders), keep base=/, and retain Qiankun lifecycle compatibility. Provide a vite.config.ts with manual chunking, assetFileNames, cssCodeSplit=false, @ alias, a process.env shim, and integrate vite-plugin-qiankun with useDevMode=true. Update package.json scripts to Vite commands, replace the Vue CLI Babel preset with @babel/preset-env, mirror the old index.html structure, and document migration steps, verification checklist, plus any npm install workarounds.
```
