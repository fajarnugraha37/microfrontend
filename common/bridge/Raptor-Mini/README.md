# Vuex 3 → Pinia Bridge (Raptor-Mini)

This directory contains a small, pragmatic runtime bridge to enable using **Pinia** stores in Vue 3 microfrontends while keeping the **Vuex 3** global store (host/shell) as the canonical state source.

Key modules:

- `vuexBridgeConfig.js` - configure how to access the global store (props or window).
- `createVuexModulePiniaStore.js` - factory to create Pinia store that proxies a Vuex module.
- `registerAllVuexModulesAsPinia.js` - convenience helper to auto-generate Pinia stores for every namespaced Vuex module.
- `exampleModule.js` - a small sample Vuex module compatible with Vuex 3 and Vuex 4.

Design and usage

- Pinia stores created by `createVuexModulePiniaStore` read state and getters from Vuex module and expose `commitLocal(type, payload)` and `dispatchLocal(type, payload)` for writes.
  - Note: The returned Pinia store exposes reactive properties as refs (via `toRefs`). When using them in JavaScript (not templates), unwrap with `.value` or use `toRef`/`unref`.
- The Pinia store subscribes to Vuex mutations and keeps its mapped state in sync. It avoids creating multiple subscriptions per module and exposes `stopBridge()` to tear down subscriptions.
- `getGlobalStore()` falls back to `window.Vuex` unless `configureVuexBridge` has been called with a custom `getGlobalStore` function.

Tradeoffs & Limitations

- Reactivity bridge: Vuex (Vue 2) and Pinia (Vue 3) don't share the same reactivity engine. This bridge copies mapped state into Pinia, and maintains it with subscriptions. There's no magical single reactive object shared between frameworks.
- Performance: Frequent Vuex mutations on large modules will trigger subscription updates and can cause overhead. Map only necessary keys using `mapState` / `mapGetters` when possible.
- Coupling: This approach tightly couples Pinia stores to the Vuex store. Migration away from Vuex requires rewriting Pinia stores to become authoritative and migrating handlers.
- Vuex internals: `registerAllVuexModulesAsPinia` optionally uses Vuex internals (`_modulesNamespaceMap`). This is pragmatic but fragile across Vuex major versions.

Quick integration (qiankun, microapp `mount(props)`):

```js
// microapp/main.js (Vue 3 + Pinia)
import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { configureVuexBridge } from './bridge/vuexBridgeConfig'
import { createVuexModulePiniaStore } from './bridge/createVuexModulePiniaStore'
import App from './App.vue'

let app = null
let pinia = null

export async function mount(props) {
  pinia = createPinia()
  configureVuexBridge({
    getGlobalStore: () => (props && props.globalStore) || (typeof window !== 'undefined' ? window.Vuex : null),
  })
  // create a Pinia wrapper for the 'example/' namespace
  const useExample = createVuexModulePiniaStore({ id: 'legacy/example', namespace: 'example/' })

  app = createApp(App)
  app.use(pinia)
  app.mount('#app')

  // In a component: const exampleStore = useExample(); exampleStore.commitLocal('SET_COUNTER', 42)
}

export async function unmount(props) {
  if (app) app.unmount()
  app = null
  pinia = null
}
```

Notes:

- Use `mapState`/`mapGetters` when you only need a subset of state to reduce overhead.
- Call `store.stopBridge()` when you unmount to clean up subscriptions when using memory-constrained environments.

