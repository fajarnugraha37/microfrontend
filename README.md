# Vue Microfrontend Demo (single-spa + Native ESM)

This repository demonstrates a Vue microfrontend platform orchestrated by [single-spa](https://single-spa.js.org/) without relying on `eval`. The stack combines Vite (shell + profile) and Vue CLI (dashboard) builds:

- `common`: Vue 2 shell application that mounts microfrontends, owns shared Vuex state, and exposes utilities via single-spa custom props.
- `app-dashboard`: Vue 2 dashboard microfrontend (Vue CLI/Webpack) consuming shared utilities and the shell's Vuex bridge. Packaged as a UMD bundle loaded via `<script>` tags to avoid `eval`.
- `app-profile`: Vue 3 (compat build) profile microfrontend with the same bridge integration.
- `components`: shared Vue component library published as a local dependency.

## Prerequisites

- Node.js 16+
- npm 8+

> The shell and profile apps run through Vite. The dashboard remains on Vue CLI 4.x to preserve its existing toolchain.

## Initial Setup

1. **Install & build the shared component library**
   ```bash
   cd components
   npm install
   npm run build
   cd ..
   ```

2. **Install dependencies for each application**
   ```bash
   cd common && npm install && cd ..
   cd app-dashboard && npm install && cd ..
   cd app-profile && npm install && cd ..
   ```

## Running the platform (development)

Open three terminals (shared library rebuild is optional once built):

```bash
# Terminal 1 - shell (single-spa root config, Vite dev server on 8080)
cd common
npm run dev

# Terminal 2 - dashboard microfrontend (Vue CLI dev server on 8081)
cd app-dashboard
npm run serve

# Terminal 3 - profile microfrontend (Vite dev server on 8082)
cd app-profile
npm run dev -- --port 8082
```

Then visit `http://localhost:8080`. Navigating to `/dashboard` or `/profile` loads the respective microfrontends:

- `app-dashboard` is fetched via `<script>`/`<link>` tags (`http://localhost:8081/js/app.js`, `http://localhost:8081/css/app.css`) and exposes its single-spa lifecycles on `window.app-dashboard-main`.
- `app-profile` is imported as a native ES module from the Vite dev server (`http://localhost:8082/src/main.js`) using the import map declared in `common/index.html`.

### Global State & Shared Utilities

- The shell exports a serialised Vuex bridge (`storeBridge`) through single-spa custom props so child apps can `commit`, `dispatch`, `watch`, or `subscribe` to shell mutations without coupling to Qiankun.
- A lightweight global event bus (`common/src/state.js`) mimics the Qiankun `initGlobalState` API (`onGlobalStateChange`, `setGlobalState`, etc.) to keep existing `$microActions` wiring working.
- Shared UI components are consumed via the local `file:../components` dependency.
- For legacy consumers that still read from `window`, the shell can optionally expose `window.appStoreBridge` / `window.sharedUtils`. These shims are created in the single-spa loader and cleared on unmount; new code should prefer injected props instead of globals.

## Production Builds

Each project has its own build target:

```bash
cd common && npm run build
cd app-dashboard && npm run build
cd app-profile && npm run build
```

- The shell outputs Vue CLI-style hashed assets plus `dist/index.html`.
- `app-dashboard` produces a UMD bundle (`dist/js/app.js`) and extracted CSS (`dist/css/app.css`). Host these files on your CDN and configure `window.__APP_DASHBOARD_BASE_URL__` (or `window.__APP_DASHBOARD_ASSETS__`) in the shell to point at the deployed URLs.
- `app-profile` emits both:
  - an ES module entry (`dist/single-spa-entry.js`) alongside hashed JS/CSS assets for single-spa hosts
  - a Qiankun-compatible UMD bundle with hashed filenames (`dist-umd/js/app.[hash].js`, `dist-umd/css/app.[hash].css`) that exposes `window.appProfile`
  Publish whichever bundle each orchestrator requires during the gradual cutover.
- All assets are loaded via standard `<script>` / `<link>` tags or native `import()`—no `eval`, no `new Function`.

### Configuring Production Asset URLs

In production you can override the dev-time defaults without rebuilding the shell:

```html
<!-- common/index.html -->
<script>
  window.__APP_DASHBOARD_BASE_URL__ = 'https://cdn.example.com/app-dashboard';
  window.__APP_DASHBOARD_ASSETS__ = {
    scripts: [
      'https://cdn.example.com/app-dashboard/js/app.1234.js'
    ],
    styles: [
      'https://cdn.example.com/app-dashboard/css/app.1234.css'
    ]
  };
  window.__APP_PROFILE_URL__ = 'https://cdn.example.com/app-profile/single-spa-entry.js';
  // Legacy Qiankun hosts can continue loading the hashed UMD bundle from dist-umd/.
</script>
```

- `__APP_DASHBOARD_BASE_URL__` supplies the root URL used for the default `js/app.js` + `css/app.css` paths.
- `__APP_DASHBOARD_ASSETS__` lets you provide exact script/style URLs (e.g. when filenames are fingerprinted). Scripts load sequentially; styles load in parallel.
- To relocate the profile microfrontend, either adjust the import map or set a custom `VITE_PROFILE_URL` during the shell build.

## Project Structure

```
common/             # Shell app (Vue 2 + Vite + single-spa root config)
app-dashboard/      # Dashboard microfrontend (Vue 2, Vue CLI / Webpack UMD bundle)
app-profile/        # Profile microfrontend (Vue 3 compat, Vite library build + UMD fallback)
components/         # Shared UI library
README.md
```

Each project retains its native tooling while exposing single-spa-friendly entry points so the shell can orchestrate routing, shared state, and utilities without Qiankun, yet Qiankun-based hosts can still load the legacy bundles during the migration.
