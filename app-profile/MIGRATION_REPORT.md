# Profile Microfrontend – Vite + single-spa Summary

## Overview

- **Previous state:** Vue CLI 4 (webpack) microfrontend exposing Qiankun lifecycles.
- **Current state:** Vite 4.5 + Vue 3 (compat) microfrontend consumed by single-spa.
- **Objectives:** Adopt Vue 3 via `@vue/compat`, keep Vue CLI-style asset contracts, and remain interoperable with both Qiankun (during migration) and single-spa (current host).

## Key Changes

| Area | Before | After |
| --- | --- | --- |
| Bundler | `vue-cli-service` (webpack) | `vite@4` + `@vitejs/plugin-vue` |
| Runtime | Vue 2.x | Vue 3 compat (`@vue/compat`) |
| Orchestrator | Qiankun (`vite-plugin-qiankun`) | single-spa (native ESM library build) |
| State | Vuex 3 singleton | Vuex 4 store factory (`createStore`) instantiated per mount |
| Output format | Qiankun UMD bundle | ES module library (`dist/single-spa-entry.js`) |
| Dev server | webpack-dev-server 8082 | Vite dev server 8082 (same origin + CORS headers) |
| Assets | Vue CLI hash pattern | Manual Rollup config matching `/js/app.[hash].js`, `/js/chunk-vendors.[hash].js`, single `/css/app.[hash].css` |

## Output Layout

`npm run build` produces:

```
dist/
├─ single-spa-entry.js        # ESM lifecycles consumed by the shell
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

The `single-spa-entry.js` file re-exports the same lifecycle object as the default `src/main.js`, allowing the shell to `import()` it or load it via an override URL.

## Configuration Notes

- `vite.config.ts` keeps `base: '/'`, disables CSS splitting, and reproduces Vue CLI naming through custom `rollupOptions.assetFileNames`.
- The build is configured as a library (`formats: ['es']`) so `dist/single-spa-entry.js` is tree-shakeable and free of UMD wrappers (no `eval`).
- Alias map includes `@ → src` and `vue → @vue/compat`; compat flags are set in `src/main.js`.
- No `vite-plugin-qiankun` dependency remains; lifecycles are implemented manually to work with both single-spa and legacy Qiankun hosts.
- `src/main.js` detects the orchestrator at runtime:
  - Standalone mode (`!window.singleSpaNavigate`) mounts automatically.
  - Under single-spa, `mount(props)` creates/destroys a dedicated root node, syncs the Vuex bridge received via `props.storeBridge`, and exposes `$microActions` helpers (`dispatchToShell`, `pushSharedState`, etc.).
  - Global shims (`window.$shellStore`, etc.) are cleared during `unmount` to avoid leaks when the app is remounted.
- Vuex 4 store includes a `sharedShell` module mirroring shell state; it is updated from single-spa custom props.
- `COMPAT_PLAN.md` tracks active compat flags and remaining Vue 3 warnings.

## Commands

```bash
npm install --legacy-peer-deps   # Required on Windows / npm 10
npm run dev                      # Vite dev server (port 8082)
npm run build                    # Production build (dist/)
npm run preview                  # Preview the production output
npm run lint                     # ESLint
```

## Verification Checklist

1. `npm run build` – verify `dist/single-spa-entry.js` exists and `dist/index.html` references `/js/app.[hash].js` and `/css/app.[hash].css`.
2. `npm run dev` – load via the shell (`http://localhost:8080/profile`) and ensure single-spa mounts the profile app without console errors.
3. Confirm the Vuex bridge received from the shell propagates login/logout mutations (check “Welcome, {user}” banner).
4. Navigate away and back to `/profile`; ensure the app remounts cleanly (no duplicate nodes, no stale listeners).
5. Optional: import the ESM bundle directly (`await import('https://cdn/.../single-spa-entry.js')`) to verify the exported lifecycles work in isolation.

## Suggested Prompt for Similar Migrations

```
You are upgrading a Vue CLI + Qiankun microfrontend to Vite + single-spa while adopting Vue 3 via @vue/compat. Preserve Vue CLI-style filenames (/js/app.[hash].js, /js/chunk-vendors.[hash].js, single /css/app.[hash].css), emit a library build that exports single-spa lifecycles (dist/single-spa-entry.js), and remove qiankun-specific plugins. Update src/main.js to use createApp, set compat flags, expose bootstrap/mount/unmount that work for both single-spa and standalone mode, and forward the store bridge/global-state props passed by the shell. Document verification steps and remaining compat flags in COMPAT_PLAN.md.
```
