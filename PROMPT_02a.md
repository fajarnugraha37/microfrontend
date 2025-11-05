# Prompt: Adopt Vue 3 Compat Build (App-Level Migration)

Run this prompt after completing the Vue CLI → Vite migration (Prompt 01) and before broader cross-app follow-up tasks (Prompt 02). It guides you through upgrading a single microfrontend from Vue 2 runtime to Vue 3 via `@vue/compat`, keeping Qiankun (or the existing orchestrator) working during the transition.

```
You are upgrading a Vue 2 microfrontend (already on Vite from the previous migration) to use Vue 3 with the compat build so that existing Vue 2 APIs keep working. Perform the migration without breaking Qiankun lifecycles, shared state, or downstream consumers.

Goals:
- Replace `vue@2.x` with `vue@^3` and add `@vue/compat`. Keep other runtime deps (Vuex 3, Vue Router 3/4 depending on app) functioning.
- Update the bundler config (Vite or Webpack) to alias `'vue' -> '@vue/compat'` and enable any required compiler flags.
- Refactor the entry file to use the Vue 3 `createApp` API while configuring `app.config.compatConfig` to retain Vue 2 behaviour (GLOBAL_MOUNT, GLOBAL_EXTEND, INSTANCE_LISTENERS, etc.). Ensure Qiankun lifecycle exports (`bootstrap`, `mount`, `unmount`) continue to work.
- Audit plugins, filters, and global mixins for Vue 3 compatibility; add shims/helpers where needed (e.g., `$listeners` → compat helpers, replacing deprecated filters with computed/methods).
- If the app uses Vue Router 3, keep it for now but ensure it works with Vue 3 compat. If the app already plans to move to Router 4, perform the minimal updates required and preserve existing routes/base paths.
- Keep Vuex 3 in place (Vuex 4 if already adopted) and verify the store bridge used by Qiankun still works.
- Maintain existing asset filenames, public paths, and DOM structure. Do not break Qiankun’s expectations (`__POWERED_BY_QIANKUN__`, container selectors, etc.).
- Document compat flags enabled/disabled and note follow-ups in `COMPAT_PLAN.md` (or the app’s migration report).

Deliverables:
1. Updated `package.json` dependencies (`vue@^3`, `@vue/compat`, compatible router/store versions) and scripts if needed.
2. Bundler config changes (e.g., `vite.config.ts`, `webpack.config.js`) adding the `'vue': '@vue/compat'` alias and any compiler options.
3. Refactored `src/main.js` (or `.ts`) to use `createApp`, configure compat flags, and maintain Qiankun lifecycles (bootstrap/mount/unmount). Ensure standalone mode still mounts automatically.
4. Necessary component/plugin adjustments (listeners, scoped slots, filters) plus helper shims if required.
5. Documentation updates summarising compat flags, outstanding warnings, and next steps (e.g., migrating shared components or removing deprecated APIs).
6. Verification notes: `npm run dev`, `npm run build`, and Qiankun integration smoke tests should all succeed.
```
