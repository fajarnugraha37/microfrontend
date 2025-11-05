# Profile Microfrontend – Vite + single-spa Summary

## Overview

- **Previous state:** Vue CLI 4 (webpack) microfrontend exposing Qiankun lifecycles.
- **Current state:** Vite 4.5 + Vue 3 (compat) microfrontend that ships both an ES module bundle (for single-spa) and a hashed UMD bundle (for legacy Qiankun hosts).
- **Objectives:** Adopt Vue 3 via `@vue/compat`, preserve Vue CLI-style asset contracts, and keep the micro app callable from either orchestrator during the gradual migration.

## Key Changes

| Area | Before | After |
| --- | --- | --- |
| Bundler | `vue-cli-service` (webpack) | `vite@4` + `@vitejs/plugin-vue` |
| Runtime | Vue 2.x | Vue 3 compat (`@vue/compat`) |
| Orchestrator | Qiankun (`vite-plugin-qiankun`) | single-spa (ES module) **and** Qiankun (UMD fallback) |
| State | Vuex 3 singleton | Vuex 4 store factory (`createStore`) per mount |
| Output format | Qiankun UMD bundle | ES module + hashed UMD bundle (`dist-umd/`) |
| Dev server | webpack-dev-server 8082 | Vite dev server 8082 |
| Assets | Vue CLI hash pattern | Manual Rollup config matching `/js/app.[hash].js`, `/js/chunk-vendors.[hash].js`, `/css/app.[hash].css` |

## Output Layout

`pnpm run build` now invokes `build:esm` and `build:umd`:

```
dist/
├─ single-spa-entry.js        # ESM lifecycles for single-spa
├─ js/app.[hash].js
├─ js/chunk-vendors.[hash].js
├─ css/app.[hash].css
└─ … hashed assets …

dist-umd/
├─ js/app.[hash].js          # Qiankun-compatible UMD bundle (vendors inlined)
└─ css/app.[hash].css
```

Both bundles expose the same lifecycle object and can be consumed interchangeably.

## Configuration Notes

- `vite.config.ts` keeps `base: '/'`, disables CSS splitting, and reproduces Vue CLI naming through custom `assetFileNames`.
- `vite.umd.config.ts` emits the hashed UMD bundle into `dist-umd/` without clearing the ESM output (`emptyOutDir: false`). Rollup’s `inlineDynamicImports: true` is enabled because UMD output does not support code splitting; the vendors are bundled into `js/app.[hash].js`.
- Dev-time legacy polyfills (`@vitejs/plugin-legacy`) run only during `vite dev`; library builds omit the plugin (it does not support library mode).
- Alias map includes `@ → src` and `vue → @vue/compat`; compat flags are configured in `src/main.js`.
- `src/main.js` detects the orchestrator at runtime:
  - Standalone mode mounts automatically when neither Qiankun nor single-spa is present.
  - Under single-spa, `mount(props)` creates or reuses a dedicated `.app-profile-root`, syncs the Vuex bridge (`props.storeBridge`), and exposes `$microActions` helpers.
  - Under Qiankun, lifecycles mount into the provided container’s `#app`, preserving the legacy contract.
- Vuex 4 store includes a `sharedShell` module mirroring shell state and is kept in sync via the bridge/global state bus.
- Optional window shims (`window.appStoreBridge`, `window.sharedUtils`) remain for partially migrated consumers and are cleared on `unmount`.

## Commands

```bash
pnpm install --legacy-peer-deps
pnpm run dev          # Vite dev server (8082)
pnpm run build        # Produces dist/ (ESM) + dist-umd/ (UMD)
pnpm run preview
pnpm run lint
```

## Verification Checklist

1. `pnpm run build` → confirm `dist/single-spa-entry.js`, hashed app/chunk-vendors bundles in `dist/js/`, and the hashed UMD bundle in `dist-umd/` exist.
2. `pnpm run dev` → navigate to `http://localhost:8080/profile`; single-spa should mount without errors.
3. Load the UMD bundle from `dist-umd/` in a Qiankun host (or test harness) and ensure `window.appProfile.mount()` works.
4. Validate Vuex bridge sync (login/logout) for both orchestrators.
5. Navigate away/back to `/profile`; ensure containers are cleaned up and remounted without leaks.
6. Optional: import the ESM bundle directly (`await import('https://cdn/.../single-spa-entry.js')`) for standalone smoke tests.

## Suggested Prompt for Similar Migrations

```
You are upgrading a Vue CLI + Qiankun microfrontend to Vite + single-spa while adopting Vue 3 via @vue/compat. Preserve Vue CLI-style filenames, emit both an ES module bundle (dist/single-spa-entry.js) and a hashed Qiankun-compatible UMD bundle (dist-umd/js/app.[hash].js and dist-umd/css/app.[hash].css), and remove qiankun-specific plugins. Update src/main.js to use createApp, set compat flags, expose bootstrap/mount/unmount that work for both single-spa and Qiankun, and forward the store bridge/global-state props passed by the host. Document verification steps and remaining compat flags in COMPAT_PLAN.md.
```
