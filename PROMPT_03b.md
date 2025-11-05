# Prompt: Move from Qiankun to single-spa (Mixed Tooling)

Use this prompt when you need to replace Qiankun with single-spa while keeping the existing Vue apps intact—even if they are built with different toolchains (Vite + Vue 2 shell, Vue CLI dashboard, Vite + Vue 3 compat profile).

```
You are refactoring a Vue microfrontend platform that currently relies on Qiankun. Replace the orchestrator with single-spa, avoid any `eval`/`new Function`, and keep each micro app on its existing build stack (shell + profile on Vite, dashboard on Vue CLI).

Goals:
- Remove Qiankun dependencies from shell and child apps; migrate lifecycle wiring to single-spa (`registerApplication`, `start`, `customProps`).
- Keep the shell (Vue 2, Vite) responsible for routing, shared Vuex bridge, and global state bus. Provide a Qiankun-compatible facade (`onGlobalStateChange`, `setGlobalState`, etc.) so child apps continue using `$microActions` unchanged.
- Load Vite-built MFEs (e.g., app-profile) via import maps / native `import()`. Load Vue CLI MFEs (e.g., app-dashboard) via `<script>` / `<link>` tags, exposing single-spa lifecycles on `window.<app-name>`.
- For Vite microfrontends that still need to serve Qiankun hosts, add a secondary build (e.g., `vite.umd.config.ts`) that emits hashed UMD bundles (`dist-umd/js/app.[hash].js`, `dist-umd/css/app.[hash].css`). Document how long the fallback will be maintained.
- Ensure the shell supports environment overrides for remote asset URLs (e.g., `window.__APP_DASHBOARD_BASE_URL__`, `window.__APP_DASHBOARD_ASSETS__`, `window.__APP_PROFILE_URL__`) so production deployments can point to CDN-hosted bundles.
- Update each micro app's entry file to detect single-spa (`window.singleSpaNavigate`) and manage mount/unmount lifecycle (including container creation, teardown, and Vuex bridge syncing).
- Preserve existing Vuex shared state bridging and shared utilities; confirm that both Vue 2 and Vue 3 compat children still receive working `storeBridge` props.
- Where legacy code still relies on `window.sharedUtils` / `window.appStoreBridge`, surface temporary shims from the shell (and clear them on unmount) while encouraging new code paths to consume injected props instead.
- Refresh documentation (README, PASSING_PROPS.md, ASSESSMENT_MICROFRONTEND.md) to reflect the new architecture, dev commands, and production asset configuration.

Constraints:
- Do not change public asset URL shapes or DOM structure/IDs (e.g., keep `/js/app.js`, `/css/app.css`, `<div id="app">`).
- Avoid replacing Vue CLI with Vite for apps that must remain on Webpack (e.g., dashboard). Adjust build output/minification only as needed to produce predictable UMD bundles.
- No runtime hacks reintroducing `eval`/`new Function`.
- Ensure all micro apps still run standalone for local development (router base handling, dev servers).

Deliverables:
1. Updated shell (`common/src/main.js`, HTML) registering MFEs through single-spa, loading assets appropriately, and forwarding custom props (store bridge, shared utils, global state bus).
2. Child app bootstrap updates (`src/main.js`, router configs) to support single-spa lifecycles and container management without Qiankun checks.
3. Vue CLI dashboards configured to emit single bundle + CSS with predictable filenames, plus documentation for overriding asset URLs.
4. Revised docs: README (dev/build instructions, asset overrides), PASSING_PROPS.md (props flow under single-spa), ASSESSMENT_MICROFRONTEND.md (new architecture & follow-ups).
5. Validation steps to run `npm run dev` / `npm run serve` across apps and confirm the shell loads dashboard/profile without Qiankun.
```
