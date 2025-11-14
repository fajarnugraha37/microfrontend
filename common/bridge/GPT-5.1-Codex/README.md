## Vuex 3 ⇔ Pinia Bridge (qiankun-ready)

This folder contains a production-grade bridge that lets new Vue 3 + Pinia microfrontends read and mutate the canonical Vuex 3 store exposed by the legacy shell. It is framework-agnostic at the domain level, works inside qiankun lifecycles, and stays generic (no module names baked in).

```
common/bridge/GPT-5.1-Codex
├─ README.md
├─ index.js
├─ vuexBridgeConfig.js
├─ createVuexModulePiniaStore.js
├─ registerAllVuexModulesAsPinia.js
├─ exampleModule.js
├─ domain/taskSummaryService.js
└─ examples/
   ├─ ExampleBridgeConsumer.vue
   ├─ qiankunHostSetup.js
   └─ qiankunMicroappEntry.js
```

### 1. Configuring access to the global Vuex store

`vuexBridgeConfig.js` exposes:

```js
import { configureVuexBridge, getGlobalStore } from './vuexBridgeConfig'

configureVuexBridge({
  getGlobalStore: () => props.globalStore || window.Vuex || null,
})
```

If you skip configuration, the bridge falls back to `window.Vuex`. When neither returns a store, the bridge logs a warning (once) and keeps returning `null`, so consumers can decide how to degrade.

### 2. Mirroring any Vuex module into Pinia

`createVuexModulePiniaStore(options)` returns a Pinia store definition whose state is a projection of an existing Vuex module. Key capabilities:

| Feature | Details |
| --- | --- |
| State mirroring | Reads Vuex module state (deep clones) and keeps Pinia state synced via `store.subscribe`. |
| Getter access | `store.legacyGetters` exposes a snapshot of all Vuex getters for that namespace. Provide `mapGetters(getters)` to shape the object; the mapped keys become individual Pinia getters. |
| Mutations/actions | `store.commitLocal(type, payload)` and `store.dispatchLocal(type, payload)` forward to Vuex using the module namespace (unless the module is non-namespaced). |
| Non-namespaced modules | Use `statePath` when the module lives at a specific path but does not add a namespace (e.g. `statePath: 'legacy/profile'`). Namespaced modules only need `namespace`. |

> **Note:** `mapGetters` should always return an object with a stable set of keys. The bridge calls it once with an empty snapshot to learn the getter names, then re-runs it on every getter access with live Vuex values.

```js
import { createVuexModulePiniaStore } from './createVuexModulePiniaStore'

const useLegacyAuth = createVuexModulePiniaStore({
  id: 'legacy/auth',
  namespace: 'auth/',        // namespaced Vuex module
  // statePath defaults to ['auth'] for namespaced modules, but can be overridden
  mapGetters(getters) {
    return {
      isAuthenticated: getters.isAuthenticated,
      currentUser: getters.user,
    }
  },
})

const authStore = useLegacyAuth()
authStore.commitLocal('SET_TOKEN', token)     // → commits auth/SET_TOKEN
const ready = authStore.isAuthenticated       // mapped getter
```

When you omit `mapGetters`, access Vuex getters through `store.legacyGetters`. The helper re-runs on each access, so the data stays current without sharing references.

### 3. Auto-registering every module

`registerAllVuexModulesAsPinia(options)` inspects Vuex internals (`store._modules`, `_modulesNamespaceMap`) to mirror **every** module:

```js
import { registerAllVuexModulesAsPinia } from './registerAllVuexModulesAsPinia'

const legacyStores = registerAllVuexModulesAsPinia({
  idPrefix: 'legacy',
  includeRoot: true,                     // mirrors the entire store as `<root>`
  filter(descriptor) {
    return !descriptor.namespace.startsWith('debug/');
  },
})

// Usage
const useExamStore = legacyStores['exam/']
const useCandidateStore = legacyStores['candidate/profile'] // non-namespaced path
```

Descriptors exposed to `filter` & `idFactory` look like:

```js
{
  path: ['candidate', 'profile'],
  namespace: '',            // empty → non-namespaced module
  namespaced: false,
  module: rawVuexModule,
}
```

### 4. Example Vuex module and domain separation

`exampleModule.js` is a typical Vuex 3/4 module:

```js
import { summarizeTasks } from './domain/taskSummaryService'

export const exampleModule = {
  namespaced: true,
  state: () => ({ tasks: [], status: 'idle' }),
  getters: {
    completionSummary(state) {
      return summarizeTasks(state.tasks) // pure helper
    },
  },
  mutations: { ... },
  actions: { ... },
}
```

Shared business logic lives in `domain/taskSummaryService.js`—plain functions with JSDoc types. The module consumes those helpers, and the Pinia bridge simply reflects the resulting state.

### 5. qiankun integration

Host (Vue 2 + Vuex + qiankun):

```js
// examples/qiankunHostSetup.js
window.Vuex = store
registerMicroApps([
  {
    name: 'vue3-pinia-tasks',
    entry: '...',
    container: '#micro-frontend',
    props: { globalStore: store },
  },
])
```

Microapp (Vue 3 + Pinia + qiankun):

```js
// examples/qiankunMicroappEntry.js
configureVuexBridge({
  getGlobalStore: () => props.globalStore || window.Vuex || null,
})

const useExampleStore = createVuexModulePiniaStore({
  id: 'legacy/example',
  namespace: 'example/',
})

const legacyStoreMap = registerAllVuexModulesAsPinia()
app.provide('legacyStores', legacyStoreMap)
```

`ExampleBridgeConsumer.vue` shows a component consuming the bridged store, reading getter snapshots, and dispatching Vuex actions without ever importing Vuex directly.

### 6. Operational notes & trade-offs

- **Duplication vs reference:** Pinia state stores cloned snapshots to avoid mutating Vuex directly. Sync happens through `store.subscribe`, so heavy mutation throughput may cause frequent patches.
- **Getter snapshots:** Default behavior exposes `store.legacyGetters`. Provide `mapGetters` to derive ergonomic Pinia getters; the mapper runs on every access to stay fresh.
- **Non-namespaced modules:** Use `statePath` so the bridge knows where to read from. Mutations/actions are dispatched without prefixes, which mirrors how Vuex treats non-namespaced modules.
- **Subscriptions:** Each Pinia store installs a Vuex `subscribe` handler and disposes it via `store.$dispose`. In qiankun, unmounting the microapp disposes Pinia, which tears down the bridge listeners and avoids leaks.
- **Multiple apps:** All MFEs share a single Vuex instance exposed either on `window` or via qiankun props. The bridge assumes the reference stays stable for the lifetime of the microapp.
- **Limitations:** We cannot share the Vue 2 and Vue 3 reactivity graphs; this bridge is a projection layer. Long-running optimistic updates should still go through Vuex mutations to keep every consumer consistent.

When ready to migrate modules to native Pinia, you can replace the bridged store with a real Pinia implementation incrementally—no changes required in consumers because the API mirrors Pinia conventions (`useStore`, getters, actions).
