# Prompt: Vue 3 Compat Follow-up Tasks

Use this prompt to continue the migration from Vue 2 (compat) toward native Vue 3 across the microfrontends and shared libraries.

```
You are working on a Vue 3 compat migration for a Qiankun microfrontend (currently using Vue 3 via @vue/compat). The app already boots with compat flags enabled, but outstanding warnings remain (render functions, $listeners) and Qiankun’s initGlobalState is deprecated. Complete the next phase by:

1. Updating the shared components library (e.g., `CButton`) to:
   - migrate render functions to the Vue 3 h() signature
   - remove reliance on `$listeners`, forwarding events via `emits` / `$attrs`
   - ship a new build and bump the dependency in all apps that consume it
2. Removing the `INSTANCE_LISTENERS` compat flag once the new component version is in place and retesting for regressions.
3. Planning the deprecation of Qiankun’s `initGlobalState`:
   - audit shell + child apps for usage
   - propose an alternative state-sharing mechanism or confirm upgrade timeline for Qiankun 3.0
   - document the approach in `COMPAT_PLAN.md` and the app’s migration report
4. (Optional) Add a development-only compat warning tracker to count occurrences and help triage remaining flags.

Constraints:
- Do not change public asset URLs, DOM ids, or routing behaviours.
- Ensure Qiankun mounting still works (dev + build).
- Keep Vue 3 compat enabled until all warnings are addressed; do not disable flags prematurely.
- Update documentation (`COMPAT_PLAN.md`, migration report) with new findings and decisions.

Deliverables:
- Updated shared component code + build output.
- Dependency bumps in consuming apps (e.g., shell, app-dashboard, app-profile).
- Code changes removing compat flags that are no longer needed.
- Documentation updates capturing the new state and follow-ups.
```
