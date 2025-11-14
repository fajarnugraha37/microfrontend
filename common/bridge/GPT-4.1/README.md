# Vuex 3 → Pinia Bridge for qiankun Microfrontends

## Overview
This bridge enables Vue 3 + Pinia microfrontends to proxy any Vuex 3 module (or the entire store) from a legacy shell app, supporting gradual migration in a qiankun setup. It is generic, production-grade, and works with any module structure.

## Files
- `vuexBridgeConfig.js`: Configures and retrieves the global Vuex store (from `window.Vuex` or `props.globalStore`).
- `createVuexModulePiniaStore.js`: Factory for Pinia stores that proxy any Vuex module, with state/getters mapping, mutation/action forwarding, and Vuex subscription for state sync.
- `registerAllVuexModulesAsPinia.js`: Helper to auto-register Pinia stores for all Vuex modules by introspecting Vuex internals.
- `exampleModule.js`: Example Vuex module compatible with both Vuex 3 and 4.

## How the Bridge Works
- **State/Getter Proxying**: Pinia stores read state/getters from the Vuex store, optionally mapped.
- **Mutation/Action Forwarding**: Pinia actions call Vuex mutations/actions using the correct namespace.
- **State Sync**: Pinia stores subscribe to Vuex mutations and update their state when the relevant module changes.
- **Generic API**: Works for any module, not hard-coded to domain logic.

## Usage Example
### 1. Configure the Bridge
```js
import { configureVuexBridge } from './bridge/GPT-4.1/vuexBridgeConfig'
configureVuexBridge({
  getGlobalStore: () => (props && props.globalStore) || window.Vuex || null
})
```

### 2. Create a Pinia Store for a Vuex Module
```js
import { createVuexModulePiniaStore, subscribePiniaToVuexMutations } from './bridge/GPT-4.1/createVuexModulePiniaStore'
const useExampleStore = createVuexModulePiniaStore({
  id: 'legacy/example',
  namespace: 'example/'
})
// In setup():
const exampleStore = useExampleStore()
subscribePiniaToVuexMutations(exampleStore, 'example/')
```

### 3. Auto-register All Modules
```js
import { registerAllVuexModulesAsPinia } from './bridge/GPT-4.1/registerAllVuexModulesAsPinia'
const stores = registerAllVuexModulesAsPinia()
```

### 4. Example Vue 3 Component
```js
<script setup>
import { useExampleStore } from './bridge/GPT-4.1/createVuexModulePiniaStore'
const exampleStore = useExampleStore()
</script>
<template>
  <div>
    <p>Count: {{ exampleStore.count }}</p>
    <p>Double: {{ exampleStore.doubleCount }}</p>
    <button @click="exampleStore.commitLocal('SET_COUNT', exampleStore.count + 1)">Increment</button>
    <button @click="exampleStore.dispatchLocal('increment')">Async Increment</button>
  </div>
</template>
```

## Tradeoffs & Limitations
- **State Duplication**: Pinia state is a shallow copy of Vuex state; not reactive across frameworks.
- **Subscription Overhead**: Each Pinia store subscribes to Vuex mutations; may add overhead for many modules.
- **Coupling**: Uses Vuex internals (`_modulesNamespaceMap`) for full module coverage.
- **No Magic Reactivity**: Vue 2 and Vue 3 do not share a reactivity graph; this is a bridge, not a direct sync.
- **Safety**: Warns if global store or namespace is missing; avoids silent failures.

## Migration Path
- Use Pinia stores as facades over Vuex modules.
- Gradually move logic to Pinia/core services as needed.
- Legacy Vuex apps continue to work; new apps use Pinia via the bridge.

---
**Drop these files into your monorepo and use them in any microfrontend.**
