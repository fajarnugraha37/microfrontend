{
  "role": "You are an expert solution architect specializing in Vue.js and microfrontend architectures.",
  "objective": "Scaffold a complete, runnable Vue 2 microfrontend project using Vue CLI, Webpack, and Qiankun. The project must demonstrate a main \"shell\" app loading multiple \"child\" apps, with clear examples of shared state, shared components, and shared utility functions.",
  "coreTechnologyStack": {
    "Vue": "Vue 2 (specifically, Vue 2.6.x)",
    "BuildTool": "Vue CLI 4 or 5 (must support Vue 2)",
    "Bundler": "Webpack 4/5 (as managed by Vue CLI)",
    "MFEFramework": "Qiankun",
    "Routing": "Vue Router (for both shell and child apps)",
    "StateManagement": "Vuex",
    "Persistence": "vuex-persistedstate (to demonstrate the \"Vuex with local storage\" requirement)"
  },
  "projectArchitecture": {
    "title": "Project Architecture & Directory Structure",
    "description": "Create a top-level directory. Inside, create separate folders for each app. Do not use a monorepo; create four distinct Vue CLI projects:",
    "projects": [
      {
        "path": "/common (Main App)",
        "description": "The main \"shell\" or \"parent\" application."
      },
      {
        "path": "/app-profile (Child App)",
        "description": "A micro-application."
      },
      {
        "path": "/app-dashboard (Child App)",
        "description": "A micro-application."
      },
      {
        "path": "/components (Shared UI Library)",
        "description": "A dedicated project for shared Vue components."
      }
    ]
  },
  "tasks": [
    {
      "task": "Task 1: /common (Main Shell App) Implementation",
      "steps": [
        {
          "title": "Project Setup",
          "details": [
            "Initialize a new Vue 2 project using Vue CLI.",
            "Add Vue Router and Vuex.",
            "Install `qiankun`."
          ]
        },
        {
          "title": "App Layout (App.vue)",
          "details": [
            "Create a main layout with a persistent navigation menu (e.g., links for \"Dashboard\", \"Profile\", \"Users\").",
            "Create a main content area (e.g., `<div id=\"micro-app-container\"></div>`) where the child apps will be mounted."
          ]
        },
        {
          "title": "Routing (router/index.js)",
          "details": [
            "Set up routes for local pages (e.g., `/`, `/login`).",
            "Set up \"catch-all\" routes that will trigger the MFE loading.",
            "Example: `{ path: '/dashboard/:path*', ... }`, `{ path: '/profile/:path*', ... }`"
          ]
        },
        {
          "title": "Shared Utils (src/utils/index.js)",
          "details": [
            "Create a new file `src/utils/index.js`.",
            "Create and export simple utility functions.",
            "`export const formatDate = (date) => { ... };`",
            "`export const checkPermissions = (user, permission) => { ... };`"
          ]
        },
        {
          "title": "Qiankun Registration (main.js)",
          "details": [
            "Import `registerMicroApps` and `start` from `qiankun`.",
            "Import the shared utils: `import * as sharedUtils from './utils';`",
            "Define an `apps` array to register the child apps. Crucially, pass the utils via `props`.",
            "Call `start()` after the main app is mounted."
          ],
          "codeExample": "const apps = [\n  {\n    name: 'app-dashboard',\n    entry: '//localhost:8081',\n    container: '#micro-app-container',\n    activeRule: '/dashboard',\n    props: {\n      sharedUtils: sharedUtils\n    }\n  },\n  {\n    name: 'app-profile',\n    entry: '//localhost:8082',\n    container: '#micro-app-container',\n    activeRule: '/profile',\n    props: {\n      sharedUtils: sharedUtils\n    }\n  }\n  // ... app-user registration\n];\nregisterMicroApps(apps);"
        },
        {
          "title": "Global State (Action Center)",
          "details": [
            "Requirement: Share state from the shell (e.g., user info, auth token).",
            "Implementation: Use Qiankun's `initGlobalState`.",
            "In `main.js` (or a dedicated `state.js`):",
            "Initialize a global state (e.g., `{ user: null, token: null }`).",
            "Expose `onGlobalStateChange` and `setGlobalState` methods. These will be automatically passed to child apps via `props`.",
            "Demonstrate: When a \"Login\" button in the shell is clicked, use `setGlobalState` to update the user info."
          ]
        },
        {
          "title": "Vuex Store",
          "details": [
            "Set up a local Vuex store for the shell app.",
            "Use `vuex-persistedstate` to save the shell's state (e.g., auth token) to local storage."
          ]
        }
      ]
    },
    {
      "task": "Task 2: /app-dashboard & /app-profile (Child App) Implementation",
      "note": "The steps below are for both child apps.",
      "steps": [
        {
          "title": "Project Setup",
          "details": [
            "Initialize a new Vue 2 project using Vue CLI.",
            "Add Vue Router and Vuex."
          ]
        },
        {
          "title": "Webpack Configuration (vue.config.js)",
          "details": [
            "This is critical. Modify the Webpack config to support Qiankun.",
            "Set `publicPath` to be dynamic (to load assets from the correct URL).",
            "Configure `output`:",
            "`library: 'app-dashboard-[name]'` (or `app-profile-[name]`)",
            "`libraryTarget: 'umd'`",
            "`jsonpFunction: 'webpackJsonp_app-dashboard'` (to avoid global conflicts)",
            "Configure `devServer` headers to allow CORS (`Access-Control-Allow-Origin: '*'`)."
          ]
        },
        {
          "title": "Entry File (main.js)",
          "details": [
            "Export Lifecycles: Do not mount the app immediately. Instead, export the standard Qiankun lifecycles: `bootstrap`, `mount`, and `unmount`.",
            "Dynamic `publicPath`: Set the `__webpack_public_path__` dynamically based on the `window.__POWERED_BY_QIANKUN__` flag.",
            "`mount` function:",
            "This function must create a new Vue instance *each time it's called*.",
            "It will receive `props` from the shell (containing `sharedUtils`, `onGlobalStateChange`, etc.).",
            "Crucial: Use the `props.container` to render the app (e.g., `render(h) h(App, { props: { ... } }), props.container.querySelector('#app')`).",
            "Crucial: Pass the `props` into the root `App.vue` component so pages can access them.",
            "Crucial: Store the Vue instance so it can be destroyed in `unmount`."
          ]
        },
        {
          "title": "Routing (router/index.js)",
          "details": [
            "Set `base` for the router dynamically (e.g., `window.__POWERED_BY_QIANKUN__ ? '/dashboard/' : '/'`).",
            "Create 3-5 example pages/routes for each app (e.g., `/`, `/details`, `/settings`).",
            "Create at least one page with a form (e.g., text inputs, buttons) to demonstrate functionality."
          ]
        },
        {
          "title": "Consuming Shared State & Functions",
          "details": [
            "Requirement: Read and react to the shell's global state and use its shared functions.",
            "Implementation: In the `mount` lifecycle, pass `props` to the root Vue instance.",
            "Inside any child component (e.g., `App.vue` or a page):",
            "Accept the `props` (e.g., `props: ['sharedUtils', 'onGlobalStateChange']`).",
            "Global State: Call `this.onGlobalStateChange((state, prevState) => { ... })` in the component's `mounted` hook to listen for changes.",
            "Shared Functions: Call `this.sharedUtils.formatDate(...)` directly.",
            "Demonstrate: Show \"Welcome, [username]\" from global state, and display a formatted date using the shared function.",
            "Bonus: Show how a child app can call `this.setGlobalState(...)` (which also comes from props) to communicate *back* to the shell."
          ]
        },
        {
          "title": "Child App index.html",
          "details": [
            "Ensure this file exists. It is the entry point Qiankun will fetch."
          ]
        }
      ]
    },
    {
      "task": "Task 3: /components (Shared UI Library) Implementation",
      "steps": [
        {
          "title": "Project Setup",
          "details": [
            "Initialize a new Vue 2 project.",
            "Build Target: Modify `vue.config.js` and the `package.json` build script to build as a library (UMD), not an app.",
            "The entry point should be a file that exports all components (e.g., `src/index.js`)."
          ]
        },
        {
          "title": "Create Components",
          "details": [
            "Create 1-2 simple, re-usable components (e.g., `CButton.vue`, `CInput.vue`)."
          ]
        },
        {
          "title": "Usage",
          "details": [
            "In the /common (Main App) and /app-dashboard (Child App):",
            "Show how to import and use these shared components. (For simplicity in this demo, you can build the library and then copy the output `dist` folder, or `npm link` it, but for the code generation, just show the *import* and *usage* in the other apps, assuming the library is built and available).",
            "Alternative: Show how to `npm install ../components` (assuming local file paths)."
          ]
        }
      ]
    }
  ],
  "deliverables": [
    {
      "item": "File Structure",
      "description": "Provide a complete file tree for all 4 projects."
    },
    {
      "item": "Key Code",
      "description": "Provide the full, complete code for the following critical files:",
      "files": [
        "common/vue.config.js",
        "common/src/main.js (with Qiankun registration and props)",
        "common/src/router/index.js",
        "common/src/utils/index.js (the new shared functions file)",
        "common/src/state.js (or wherever initGlobalState is)",
        "app-dashboard/vue.config.js (with UMD output)",
        "app-dashboard/src/main.js (with lifecycle exports, passing props)",
        "app-dashboard/src/router/index.js (with dynamic base path)",
        "app-dashboard/src/App.vue (showing how it reads global state and utils from props)",
        "components/vue.config.js (build as library)",
        "components/src/index.js (exporting components)"
      ]
    },
    {
      "item": "Run Instructions",
      "description": "Provide a `README.md` with clear, step-by-step instructions on how to install dependencies and run all 4 projects simultaneously (e.g., `cd common && npm run serve`, `cd app-dashboard && npm run serve -- --port 8081`, etc.)."
    }
  ]
}


---

you are a repo refactoring agent. 
convert ./app-profile vue 2 vue-cli (webpack) micro-frontend **shell** app to vite **without** breaking downstream children that hard-link the shell’s files.

## constraints (hard)

* keep public urls & filenames **identical in shape** to vue-cli:

  ```
  /js/app.[hash].js
  /js/chunk-vendors.[hash].js
  /js/[name].[hash].js         # async chunks
  /css/app.[hash].css          # single css file
  /img/[name].[hash].[ext]
  /fonts/[name].[hash].[ext]
  ```
* preserve existing `publicPath` (from `vue.config.js`) as vite’s `base`.
* keep `<div id="app"></div>` root and meta tags from the current app html.
* produce one css file like vue-cli extract css (no per-chunk css).
* qiankun host (shell) continues to work; do not introduce runtime publicPath hacks in host.
* do not change app semantics (env vars, aliases, assets) unless necessary; if needed, codemod safely.

## deliverables

1. `vite.config.ts` that forces vue-cli-like outputs.
2. `index.html` generated (or rewritten) to mimic vue-cli’s injected html (script + css links) while being valid vite entry html.
3. `package.json` scripts updated (`dev`, `build`, `preview`) and deps added.
4. compatibility shims:

   * alias `@` → `src`
   * env shim for common `process.env` → `import.meta.env` (minimal, safe)
5. optional postbuild alias script to create extra legacy filenames if any consumers hard-pin exact names.
6. a migration report (markdown) with before/after, what changed, and how to run/verify.

## repo scan

* read `vue.config.js`, `package.json`, `src/main.js`, `public/index.html` (or template), `src/assets/**`, any `pages` config, aliases, and env usage.
* extract:

  * `publicPath` (default `/`)
  * `assetsDir` (default `''`, vue-cli actually uses `img/`, `fonts/`)
  * css extract setting, filename hashing, multi-page entries
  * devServer proxy settings
  * presence of qiankun bootstrapping in shell

## code changes

### a) deps

* add (vue 2): `"vite": "^latest"`, `"vite-plugin-vue2": "^latest"`, `"@vitejs/plugin-legacy": "^latest"`
* keep existing vue 2 deps (vue 2.7 ok). do **not** upgrade to vue 3 here.

### b) vite config (force vue-cli naming)

create `vite.config.ts` with:

### c) index.html (vite entry) that **mimics vue-cli output**

* create `index.html` at repo root.
* preserve title, meta, favicon links from current app.
* body must have `<div id="app"></div>`.
* include the vite entry module script to `src/main.js`.
* vite will rewrite html on build to include hashed js/css. we want the final built html to present:

  * `<script type="module" src="/js/app.[hash].js" ...>`
  * `<link rel="stylesheet" href="/css/app.[hash].css">`

### d) env + aliases

* ensure `@` alias resolves to `src` (above).
* if code uses `process.env.VUE_APP_*`, either:

  * add **minimal** shim: install `vite-plugin-env-compatible` and enable it, **or**
  * codemod: replace `process.env.VUE_APP_X` → `import.meta.env.VITE_X`.
* keep `.env`, rename keys to `VITE_*` where necessary; preserve existing values.

### e) scripts

update `package.json`:

### f) optional legacy alias script (if any consumers hard-pin exact filenames)

create `scripts/compat-alias.mjs`:

leave `wanted` empty unless you truly need extra aliases.

## tests (must pass)

* run `npm run build`. verify `dist` contains exactly:

  * `js/app.[hash].js`, `js/chunk-vendors.[hash].js`, `css/app.[hash].css`, plus async chunks under `js/` and assets under `img/` & `fonts/`.
* open `dist/index.html` and ensure it references `/js/app.[hash].js` and `/css/app.[hash].css`.
* smoke dev: `npm run dev` (HMR ok).
* qiankun host still mounts children (no changes to qiankun bootstrap).
* if repo previously had `publicPath` ≠ `/`, confirm vite `base` matches it.

## multi-page (if `vue.config.js.pages` existed)

* replicate pages by creating multiple html entries or using rollup multi-input.
* each page should emit `js/app.[hash].js` for its entry; if collisions, name them `js/<pagename>.[hash].js` and adjust children references accordingly (document in report).

## do not

* do not upgrade to vue 3.
* do not change dom structure or ids.
* do not rename routes or chunk names except as required to meet the filename contract above.

## output

* modified files + new files committed.
* `MIGRATION_REPORT.md` summarizing:

  * original vs new build shapes (tree listings)
  * how `base` was chosen
  * env changes
  * how to dev/build/preview
  * any remaining follow-ups

use small, atomic commits with messages like:

* `chore(vite): add vite config with vue-cli-compatible output`
* `build(html): add vite index.html preserving vue-cli semantics`
* `chore(env): minimal env compatibility shim`
* `docs: add MIGRATION_REPORT`
