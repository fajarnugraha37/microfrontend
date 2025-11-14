# Shell Modernisation Summary

## Overview

- **Previous state:** Vue CLI 4 (webpack) shell orchestrated by Qiankun.
- **Current state:** Vite 5 + single-spa shell (Vue 2 runtime retained) with mixed microfrontend toolchains (Vite + Vue CLI).
- **Objectives:** Replace the legacy build/orchestrator stack without breaking asset contracts (`/js/app.[hash].js`, `/css/app.[hash].css`) or downstream microfrontends that hard-link shell files.

## Key Changes

| Area | Before | After |
| --- | --- | --- |
| Bundler | `vue-cli-service` (webpack) | `vite` (Rollup under the hood) |
| Orchestrator | Qiankun (`registerMicroApps`) | single-spa (`registerApplication`) |
| Dev scripts | `npm run serve` | `npm run dev` |
| Build output | `dist/js/[name].js` (no hashing) | `dist/js/app.[hash].js`, `dist/js/chunk-vendors.[hash].js`, single `css/app.[hash].css` |
| Global state | Qiankun `initGlobalState` | Custom event bus with Qiankun-compatible API (`onGlobalStateChange`, `setGlobalState`, etc.) |
| Vuex sharing | Qiankun props only | single-spa `customProps` + optional `window.appStoreBridge` shim |
| Asset loading | Qiankun `entry` URLs | Import map for ESM MFEs + `<script>/<link>` loader for Vue CLI bundles |

## Output Layout

`npm run build` produces the following structure (Vue CLI-style filenames preserved):

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

## Configuration Notes

- `base` remains `/`, mirroring the historic `publicPath`.
- Rollup manual chunking collapses node_modules into `chunk-vendors` while the entry stays `js/app.[hash].js`.
- `cssCodeSplit: false` ensures a single CSS bundle just like Vue CLI.
- Asset file names are mapped to Vue CLI-style folders (`img/`, `fonts/`) via `assetFileNames`.
- Dev server runs on **8080** with permissive CORS headers so MFEs served from other ports can fetch shell assets.
- Legacy browser support is handled by `@vitejs/plugin-legacy`, allowing us to keep Babel on `@babel/preset-env` (transform-only).
- `common/src/main.js` now registers microfrontends with single-spa:
  - Vite/ESM MFEs (e.g., `app-profile`) load through the import map (`http://localhost:8082/src/main.js` in dev).
  - Vue CLI MFEs (e.g., `app-dashboard`) load via sequential `<script>`/`<link>` injection using URLs derived from `window.__APP_DASHBOARD_BASE_URL__` or an explicit `window.__APP_DASHBOARD_ASSETS__` array.
- The Vuex bridge is created once (`createStoreBridge(store)`) and forwarded through single-spa `customProps`. For legacy consumers that still read from `window`, we optionally assign `window.appStoreBridge`.
- The new global-state bus (`common/src/state.js`) mimics Qiankun’s API so child apps keep calling `$microActions.onGlobalStateChange` / `setGlobalState` without code changes.

## Commands

```bash
# Start Vite dev server (port 8080)
npm run dev

# Build production assets (Vue CLI-style filenames)
npm run build

# Preview the production build locally
npm run preview

# Lint the codebase
npm run lint
```

## Verification Checklist

1. `npm run build` – confirm `dist/index.html` references `/js/app.[hash].js` and `/css/app.[hash].css`.
2. `npm run dev` – visit `http://localhost:8080/dashboard` and `/profile`; single-spa should lazy-load Vue CLI + Vite MFEs without console errors.
3. Override asset URLs by setting `window.__APP_DASHBOARD_BASE_URL__` or `window.__APP_DASHBOARD_ASSETS__` before `start()`, verifying the shell uses the provided CDN paths.
4. Trigger auth logins/logouts to ensure the Vuex bridge still syncs shell state to child apps.
5. Unmount/remount MFEs (navigate away/back) and confirm injected `<script>`/`<link>` tags are deduped and removed appropriately.
6. On Windows/npm 10, use `npm install --legacy-peer-deps` to work around the upstream `matches` resolution issue.

## Suggested Prompt for Future Shell Migrations

```
You are modernising a Vue 2 shell that previously used Vue CLI + Qiankun. Move it to Vite while preserving Vue CLI-style filenames, then replace Qiankun with single-spa so Vite MFEs can load via import maps and Vue CLI MFEs via script tags. Implement a custom loader in src/main.js that honours runtime asset overrides (window.__APP_DASHBOARD_BASE_URL__/__APP_DASHBOARD_ASSETS__/__APP_PROFILE_URL__), expose the Vuex bridge and global-state bus through single-spa customProps (plus optional window shims), and document verification steps for /dashboard and /profile routes.
```
