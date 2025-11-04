# Vue 3 Compat Migration Plan

## Current Compat Configuration

The microfrontend now boots with Vue 3 via the compat build using:

```js
app.config.compatConfig = {
  MODE: 2,
  GLOBAL_MOUNT: true,
  GLOBAL_EXTEND: true,
  GLOBAL_PROTOTYPE: true,
  INSTANCE_SCOPED_GLOBALS: true,
  ATTR_FALSE_VALUE: true,
  COMPONENT_V_MODEL: true,
  RENDER_FUNCTION: true
};
```

### Meaning & Next Steps

| Compat Flag | Why Enabled | Migration Exit Criteria |
| --- | --- | --- |
| `MODE: 2` | Default Vue 2 behaviour to keep templates/plugins working. | Audit components and turn off rule-by-rule (set `MODE: 3`) once remaining compat flags below are retired. |
| `GLOBAL_MOUNT` | Legacy code may rely on `Vue.mixin`/`Vue.component` in third-party plugins. | Ensure no runtime uses `Vue.*` globals, then remove the flag. |
| `GLOBAL_EXTEND` / `GLOBAL_PROTOTYPE` | Components still access `this.$sharedUtils`, `this.$microActions` via global prototype. | Replace with explicit `app.config.globalProperties` usage (done for new util) and audit third-party plugins; once no legacy extend/prototype APIs used, drop flags. |
| `INSTANCE_SCOPED_GLOBALS` | Required for instance-level access to `$set`, etc., from Vuex-derived helpers. | Replace any `this.$set`/`this.$delete` usage with native reactivity helpers, verify tests. |
| `ATTR_FALSE_VALUE` | Preserve attribute removal semantics relied on in templates. | Confirm components handle boolean attrs using Vue 3 semantics; update templates accordingly. |
| `COMPONENT_V_MODEL` | Custom components still use the legacy `value`/`input` v-model contract. | Incrementally migrate to `modelValue`/`update:modelValue` emits. |
| `RENDER_FUNCTION` | Some render functions (if any) still target the Vue 2 API. | Audit render functions (none detected yet) and migrate to Vue 3 h() signature, then drop flag. |

## Known Compat Warnings

- **RENDER_FUNCTION** (global) — triggered by `mfe-components/CButton` render implementation. Plan: update shared component library to Vue 3 render API, then disable flag.
  - [ ] Owner: Components library maintainers. Update render functions + release new build consumed by shell & MFEs.
- **INSTANCE_LISTENERS** — `CButton` still reads `$listeners`. We enabled `INSTANCE_LISTENERS` compat. Replace with Vue 3 emits / `defineEmits`, relying on `$attrs`.
  - [ ] Owner: Components team. Refactor to forward `onClick` via emits / `inheritAttrs`.
- **qiankun initGlobalState deprecation** — Shell uses initGlobalState (see `common/src/state.js`). Need follow-up across shell + children before Qiankun 3.0.
  - [ ] Owner: Platform team. Evaluate alternative global state approach or upgrade plan.
- Continue monitoring console; append new warnings with component paths.

## Migration Checklist

1. **Global Prototype Cleanup**
   - [ ] Replace legacy prototype consumers (`this.$sharedUtils`, `$microActions`) with composables/injection once downstream consumers are ready.
   - [ ] Verify third-party plugins do not rely on `Vue.prototype`.

2. **v-model Modernisation**
   - [ ] Identify components emitting `input`/`change` for v-model.
   - [ ] Migrate to `modelValue` + `update:modelValue` where safe; document outliers.

3. **Vuex Modernisation**
   - [ ] Confirm no code relies on Vuex 3-only APIs; store now uses Vuex 4 via `createStore`.
   - [ ] Plan migration path to Pinia modules once compat warnings drop.

4. **Scoped Globals & Set/Delete**
   - [ ] Search for `$set`/`$delete`; refactor to `reactive` or `Vue.set` equivalents using native APIs.

5. **Render Function Sweep**
   - [ ] Audit for render functions (`render(h)` usage). Update to Vue 3 signature and disable `RENDER_FUNCTION`.

6. **Attr False Value**
   - [ ] Review components toggling boolean attrs and update to Vue 3 semantics (falsy value removes attr automatically).

7. **Compat Mode Tightening**
   - [ ] After individual flags are clear, flip `MODE` from `2` to `3` (Vue 3 behaviour by default) and run regression tests.

## Owners & Follow-ups

- **Initial Compat Bootstrap:** current change (this PR).
- **Future Task Owners:** assign per module (Dashboard/Profile teams) once warnings are catalogued.
- **Tracking:** open follow-up tickets for each bullet above after confirming warning counts via dev console.

## Tooling Helpers

- Added `src/compat/bridges.js` with `passListeners` and `slot` helpers to simplify gradual refactors from `$listeners`/`$scopedSlots`.
- Consider adding a compat warning collector later to aggregate counts during development.

## Immediate Next Steps

1. **Update shared components:** Coordinate with the components library to migrate `CButton` (and other affected components) away from Vue 2 render APIs and `$listeners`. Publish an updated build and bump the dependency here.
2. **Qiankun global state plan:** Align with the shell/platform team on replacing `initGlobalState` before Qiankun 3.0 removes it. Document chosen approach and timeline.
3. **Compat warning tracker:** Optionally add a lightweight dev-only tracker to count compat warnings so progress can be measured across sprints.
4. **Flag cleanup sequence:** After new component build lands, drop `INSTANCE_LISTENERS`, verify behaviour, then tackle `RENDER_FUNCTION` flag by upgrading render implementations.
