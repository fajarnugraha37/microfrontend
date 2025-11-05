# Microfrontend Migration Workflow (Vue 2 → Vue 3, Qiankun → single-spa)

This workflow documents the staged playbook we used to modernize our Vue microfrontend platform. It is designed so the team (or AI automation) can migrate dozens of repositories consistently, while allowing partial upgrades (some apps on Vue 3 compat, some still on Vue 2) and orchestrator changes without downtime.

---

## Overview

| Stage | Goal | Prompt |
| ----- | ---- | ------ |
| 0 | Inventory & prerequisites | (manual prep) |
| 1 | Move Vue CLI microfrontends to Vite while staying on Vue 2 and Qiankun | `PROMPT_01.md` |
| 2 | Upgrade an app to Vue 3 via @vue/compat | `PROMPT_02a.md` |
| 2b | Clean up compat warnings, shared components, Qiankun initGlobalState deprecation plan | `PROMPT_02.md` & `PROMPT_02b.md` |
| 3a | Abstract orchestrator specifics (Qiankun vs single-spa) | `PROMPT_03a.md` |
| 3 | Replace Qiankun with single-spa, mix toolchains (Vite + Vue CLI) | `PROMPT_03a.md` & `PROMPT_03b.md` |

The prompts live at the repo root for quick reference. Feed them to your AI tooling (Codex CLI, Copilot Workspace, etc.) with repo-specific notes.

---

## Stage 0 - Preparation

1. **Audit each repo**: note Vue version, tooling (Vue CLI or Vite), Qiankun usage, routing, shared components, unit/e2e tests, CI pipeline, and production asset naming constraints.
2. **Audit globals**: list every `window.*` attachment (utilities, stores, feature toggles). Categorise them as _must keep_, _shim temporarily_, or _remove_. This informs the compatibility bridge we create later.
3. **Establish shared tools**: ensure Node 16+, npm 8+, Vite CLI, Vue CLI if needed, lint/test runners. Create a migration tracker (spreadsheet or issue board).
4. **Capture baselines**: run `npm run build` and `npm run test` (if available). Export current `dist/` tree for comparison once the migration is done.

---

## Stage 1 – Vue CLI → Vite (keep Vue 2 + Qiankun)

**Prompt**: `PROMPT_01.md`

1. Replace `vue.config.js` with `vite.config.ts` tailored to mimic Vue CLI outputs (`/js/app.[hash].js`, `/css/app.[hash].css`, etc.).
2. Swap dev scripts (`npm run serve` → `npm run dev`), add Vite/Vite plugin dependencies (`vite-plugin-vue2`, `vite-plugin-qiankun`, `@vitejs/plugin-legacy`).
3. Convert entry HTML to Vite format while keeping `<div id="app">`, meta tags, favicon references.
4. Remove Webpack-specific globals from `src/main.js` (`__webpack_public_path__`); rely on Qiankun plugin to inject runtime base path.
5. Update Babel config to `@babel/preset-env` if necessary (for legacy builds).
6. Document the migration (before/after dist shape, commands) and smoke test Qiankun integration (`npm run dev`, `npm run build`).

Repeat for each Vue CLI microfrontend that needs Vite. If a repo must remain on Vue CLI (e.g., heavy Webpack plugins), note it for Stage 3 handling.

---

## Stage 2 – Adopt Vue 3 via Compat (per micro app)

**Prompt**: `PROMPT_02a.md`

1. Upgrade dependencies: `vue@^3`, `@vue/compat`, compatible `vue-router`/`vuex` versions as needed.
2. Alias `'vue' -> '@vue/compat'` in `vite.config.ts` (or Webpack config).
3. Rewrite `src/main.js` to use `createApp`, install router/store/plugins, configure `app.config.compatConfig` to keep Vue 2 behaviour (GLOBAL_EXTEND, INSTANCE_LISTENERS, etc.).
4. Ensure Qiankun lifecycles (`bootstrap`, `mount`, `unmount`) still work, and standalone mode mounts automatically when not under Qiankun.
5. Shim legacy APIs (filters, `$listeners`, scoped slots) with helper functions so existing components keep working.
6. Update docs: list enabled compat flags, record outstanding warnings, outline next steps in `COMPAT_PLAN.md` or migration report.

---

## Stage 2b – Compat Cleanup & Shared Components

**Prompt**: `PROMPT_02.md` / `PROMPT_02b.md`

1. Upgrade shared component libraries (render functions → Vue 3 syntax, remove `$listeners`, etc.).
2. Bump component versions in shell and child apps; re-run builds/tests.
3. Remove compat flags that are no longer needed (e.g., `INSTANCE_LISTENERS` once listeners are modernised).
4. Plan for Qiankun `initGlobalState` deprecation: audit usage, draft alternative (event bus), capture in docs.
5. Optionally add a compat warning tracker (counts by rule) to triage remaining issues.

---

## Stage 3a - Orchestrator-Agnostic Bridge

**Prompt**: `PROMPT_03a.md`

1. Create an abstraction layer for micro app registration (a wrapper module that still calls Qiankun but is swappable).
2. Refactor each `src/main.js` to expose a generic lifecycle object that works with either Qiankun or single-spa. Detect orchestrator at runtime (`window.__POWERED_BY_QIANKUN__`, `window.singleSpaNavigate`).
3. Replace Qiankun's `initGlobalState` with a custom event emitter exposing the same API. Pass it through Qiankun props to maintain backwards compatibility.
4. For repos that still rely on `window.*`, surface necessary globals through the bridge (e.g., `window.appStoreBridge = storeBridge`) while documenting deprecation plans. Provide teardown hooks so globals are removed on `unmount`.
5. Document the new bridge (how to use it, TODOs for single-spa).
6. Confirm Qiankun flows still work (dev/build/test).

This stage ensures a smooth cutover later without touching every repo simultaneously.

---

## Stage 3 - Single-spa Migration (drop Qiankun)

> Run `PROMPT_03a.md` across all repos before applying `PROMPT_03b.md` to swap the orchestrator.



**Prompt**: `PROMPT_03b.md`

1. Remove Qiankun dependencies from shell and apps. Switch the shell to single-spa (`registerApplication`, `start`, `customProps`).
2. For Vite-based MFEs, load via import maps / native `import()` (e.g., `http://localhost:8082/src/main.js` in dev, hashed `single-spa-entry.js` in prod).
3. For Vue CLI MFEs, keep Webpack builds but serve bundles via `<script>` / `<link>` tags. Expose lifecycles on `window.<appname>` (`window['app-dashboard-main']`).
4. Extend the shell loader to support environment overrides (`window.__APP_DASHBOARD_BASE_URL__`, `window.__APP_DASHBOARD_ASSETS__`, `window.__APP_PROFILE_URL__`).
5. Ensure micro apps still mount/teardown correctly: create/destroy container elements, sync Vuex bridge, push shared state back to shell.
6. Maintain compatibility shims for any remaining `window.*` consumers (e.g., `window.sharedUtils`, `window.appStoreBridge`). Update docs to track which globals remain, and add teardown in `unmount` when possible.
7. Update docs (`README`, `PASSING_PROPS.md`, `ASSESSMENT_MICROFRONTEND.md`) to match the new architecture: dev commands (mixed Vite + Vue CLI servers), production asset configuration, state sharing.
8. Smoke test: `npm run dev`/`npm run serve` for shell, dashboard, profile; verify `/dashboard`, `/profile` load under single-spa. Run `npm run build` per app to confirm bundle outputs.

---

## Managing `window.*` Globals During Partial Migration

Some legacy repos attach services or helpers to `window`. While migrating gradually:

1. **Inventory & classify**: during Stage 0, label each global as _critical_ (must keep), _shimmable_, or _removable_. Store the list beside the repo tracker.
2. **Introduce a window bridge**: create a shared utility (e.g., `src/window-bridge.js`) that centralises exposure:
   ```js
   export const exposeGlobals = ({ sharedUtils, storeBridge }) => {
     window.sharedUtils = sharedUtils;
     window.appStoreBridge = storeBridge;
   };

   export const clearGlobals = () => {
     delete window.sharedUtils;
     delete window.appStoreBridge;
   };
   ```
   Call `exposeGlobals` when the shell boots and `clearGlobals` when tearing down (single-spa `unmount`).
3. **Prefer dependency injection**: whenever you touch a repo, replace `window.X` usages with injected props, ES module imports, or single-spa custom props (`customProps.sharedUtils`). Leave a shim in place for untouched repos.
4. **Document temporary globals**: update `PASSING_PROPS.md` / `MIGRATION_REPORT.md` with which globals remain and who depends on them. Add TODOs with owners/dates.
5. **Remove gradually**: once no consumers remain, delete the shim and guard it with feature flags if needed.

This pattern lets multiple repos migrate on different timelines while keeping global APIs stable.

---

## Automation Strategy for 52 Repos

1. **Central prompt library**: store all prompts (`PROMPT_01.md`, `PROMPT_02a.md`, `PROMPT_02.md`, `PROMPT_02b.md`, `PROMPT_03a.md`, `PROMPT_03b.md`) in a shared repo. Reference them during AI-assisted runs.
2. **Repo metadata**: maintain a CSV/JSON with each repo’s current stage, tooling, and blockers. Feed metadata to the AI before running a prompt so it knows which steps to skip/modify.
3. **CI hooks**: after each stage, ensure CI runs `npm run build` and (if available) `npm run test`. Compare `dist/` outputs to check file naming consistency.
4. **Documentation**: require updates to `MIGRATION_REPORT.md`, `COMPAT_PLAN.md`, `ASSESSMENT_MICROFRONTEND.md`, and `PASSING_PROPS.md` as each stage completes.
5. **Verification**: have a standard smoke test checklist per stage (e.g., screenshot diffs, console logs, single-spa diagnostics).

---

## Quick Reference

- **Prompts**:  
  - Stage 1: `PROMPT_01.md`  
  - Stage 2: `PROMPT_02a.md`, `PROMPT_02.md`, `PROMPT_02b.md`  
  - Stage 3a: `PROMPT_03a.md`  
  - Stage 3: `PROMPT_03b.md`

- **Key Docs to Maintain**:  
  - `MIGRATION_REPORT.md` (per repo)  
  - `COMPAT_PLAN.md` (Vue 3 migration checklist)  
  - `PASSING_PROPS.md` (state/props contracts)  
  - `ASSESSMENT_MICROFRONTEND.md` (orchestrator status, follow-ups)  
  - `WORKFLOW.md` (this document, kept in sync)

---

By following these staged prompts, you can migrate repositories incrementally: first modernize the build system, then adopt Vue 3 compat, then decouple orchestrator assumptions, and finally drop Qiankun in favour of single-spa. Each stage leaves the system in a releasable state, enabling continuous delivery across all 52 repos.
