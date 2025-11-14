# Vuex → Pinia Bridge (runtime)

This folder contains a small runtime bridge to let Vue 3 + Pinia microfrontends proxy to a global Vuex 3 store (hosted by a Vue 2 shell). It is intended for qiankun microfrontend migration scenarios.

Files:

- `vuexBridgeConfig.js` — configure how to obtain the global Vuex store (from qiankun props or `window.Vuex`).
- `createVuexModulePiniaStore.js` — factory that returns a Pinia `useXxxStore` which mirrors any Vuex module and proxies commits/dispatches.
- `registerAllVuexModulesAsPinia.js` — helper that inspects Vuex internals to auto-create Pinia factories for all namespaced modules.
- `exampleModule.js` — a small example Vuex module showing the expected module shape.

Why this bridge
----------------
The idea is to treat Vuex as the canonical legacy state engine and let Pinia stores act as adapters/facades. This enables gradual migration of microfrontends to Vue 3 + Pinia without breaking existing Vuex-based apps.

Tradeoffs & limitations
----------------------
- The bridge mirrors module state into Pinia (shallow copy) and subscribes to Vuex mutations to keep them in sync. This adds subscription overhead and some duplication transiently.
- The bridge relies on a global Vuex store instance (via `props.globalStore` or `window.Vuex`). That creates coupling to the host.
- `registerAllVuexModulesAsPinia` uses non-public Vuex internals (`_modulesNamespaceMap`) — pragmatic but brittle across major Vuex changes.
- There is no shared reactivity graph between Vue 2 and Vue 3: reactive sync is achieved by copying state and subscribing to Vuex mutations. This is a deterministic bridge but not magically unified reactivity.

Usage (microapp side)
---------------------
1. In your microapp's `mount(props)` (qiankun lifecycle), configure the bridge:

```js
import { configureVuexBridge } from './bridge/Grook-Code-Fast-1/vuexBridgeConfig'

configureVuexBridge({
  getGlobalStore: () => (props && props.globalStore) || window.Vuex || null,
})
```

2. Create a Pinia store that proxies a Vuex module:

```js
import { createVuexModulePiniaStore } from './bridge/Grook-Code-Fast-1/createVuexModulePiniaStore'

const useSomeStore = createVuexModulePiniaStore({ id: 'legacy/some', namespace: 'some/' })

// inside setup()
const someStore = useSomeStore()
// read mirrored state: someStore.someField
// commit via: someStore.commitLocal('SET_FIELD', payload)
// dispatch via: someStore.dispatchLocal('doAction', payload)
```

3. Optionally auto-generate for all namespaced modules:

```js
import { registerAllVuexModulesAsPinia } from './bridge/GPT-5-mini/registerAllVuexModulesAsPinia'

const stores = registerAllVuexModulesAsPinia()
// stores is a map: { 'auth/': useAuthStore, 'profile/': useProfileStore, ... }
```

Notes
-----
Keep the bridge configuration simple. Prefer explicit factory creation for important modules to get correct mapping, and use auto-register as a convenience.
