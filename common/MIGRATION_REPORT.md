# Vite Migration Summary

## Overview

- **Previous toolchain:** Vue CLI 4 (webpack-based) with custom `vue.config.js`.
- **New toolchain:** Vite 5 + `vite-plugin-vue2` (Vue 2 runtime preserved).
- **Reason for change:** Align the common shell with Vite while keeping downstream microfrontends and deployed asset contracts intact.

## Key Changes

| Area | Before | After |
| --- | --- | --- |
| Bundler | `vue-cli-service` (webpack) | `vite` (Rollup under the hood) |
| Dev scripts | `npm run serve` | `npm run dev` |
| Build output | `dist/js/[name].js`, no hashing | `dist/js/app.[hash].js`, `dist/js/chunk-vendors.[hash].js`, one `css/app.[hash].css` |
| Config entry | `vue.config.js` | `vite.config.ts` |
| Env access | `process.env.*` (webpack define) | `import.meta.env.*` via shim (`define: { 'process.env': 'import.meta.env' }`) |
| Aliases | Implicit (`@` via Vue CLI) | Explicit `@ → src` in Vite config |

## Output Layout

Example `dist` tree (`npm run build`):

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

The filenames match Vue CLI conventions so downstream importers relying on the old contract continue to work.

## Configuration Notes

- `base` remains `/`, matching the previous `publicPath`.
- Manual Rollup chunking coerces node modules into `chunk-vendors` and keeps the application entry at `js/app.[hash].js`.
- `cssCodeSplit` is disabled to guarantee a single `css/app.[hash].css` bundle.
- Static assets keep their Vue CLI-style folders via custom `assetFileNames`.
- Dev server still runs on port **8080** with the same CORS header required by Qiankun.
- Legacy browser support is retained via `@vitejs/plugin-legacy` (without emitting extra legacy bundles).
- Babel preset switched from `@vue/cli-plugin-babel/preset` to `@babel/preset-env` (usage mode) so `vite-plugin-vue2` can compile templates without Vue CLI dependencies.

## Commands

```bash
# Start dev server (HMR, port 8080)
npm run dev

# Production build (writes to dist/ with Vue CLI-style filenames)
npm run build

# Preview built assets locally (also port 8080)
npm run preview

# Lint source using ESLint
npm run lint
```

## Verification Checklist

1. `npm run build` → confirm `dist/index.html` references `/js/app.[hash].js` and `/css/app.[hash].css`.
2. `npm run dev` → Qiankun shell mounts dashboard/profile MFEs as before (routing/state untouched).
3. Ensure any tooling or CDNs that consumed `/js/chunk-vendors.*` continue to resolve the renamed files.
4. If additional legacy filenames are required, add them via a post-build copy step (not currently needed).
5. When running `npm install` on Windows/npm v10, use `npm install --legacy-peer-deps` to avoid the upstream `Cannot read properties of null (reading 'matches')` issue.

No downstream child apps were modified; they continue to load the shell at `http://localhost:8080` with no runtime publicPath overrides.

## Suggested Prompt for Similar Migrations

```
You are migrating a Vue 2 project from Vue CLI (webpack) to Vite. Keep all public asset URLs identical to Vue CLI (`/js/app.[hash].js`, `/js/chunk-vendors.[hash].js`, single `/css/app.[hash].css`, plus `img/` & `fonts/` structure) and preserve base=/ so Qiankun consumers remain compatible. Convert vue.config.js settings (manual chunks, asset naming, dev server headers) into vite.config.ts, use `vite-plugin-vue2` with `@babel/preset-env` instead of the Vue CLI preset, and update package.json scripts to `vite` equivalents. Provide a Vite-friendly index.html that mirrors the old template, document the migration steps and verification checklist, and call out any npm install workarounds if needed.
```
