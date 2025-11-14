# Vuex 3 to Pinia Bridge

A runtime bridge for Vue 3 + Pinia microfrontends to proxy the global Vuex 3 store from a Vue 2 shell app in a qiankun-based architecture.

## Overview

This bridge enables gradual migration from Vuex 3 to Pinia by allowing new Vue 3 microfrontends to interact with the existing global Vuex 3 store. The Vuex 3 store remains the "source of truth" while Pinia stores act as reactive proxies.

## How It Works

1. **Configuration**: The bridge is configured with a function to access the global Vuex store (via qiankun props or `window.Vuex`).

2. **Store Creation**: For each Vuex module, a Pinia store is created that:
   - Mirrors the Vuex module's state
   - Provides reactive getters
   - Offers `commitLocal()` and `dispatchLocal()` methods to mutate the Vuex store

3. **Synchronization**: Pinia stores subscribe to Vuex store mutations and update their state when relevant changes occur.

4. **Generic Design**: The bridge works with any Vuex module structure and doesn't hardcode domain logic.

## Files

- `vuexBridgeConfig.js` - Configuration for global store access
- `createVuexModulePiniaStore.js` - Factory for creating Pinia proxies
- `registerAllVuexModulesAsPinia.js` - Auto-registration helper
- `exampleModule.js` - Example Vuex module
- `ExampleBridgeComponent.vue` - Vue 3 component demo
- `microapp-main-example.js` - qiankun integration example

## Usage

### In a Vue 3 Microapp

```js
// main.js
import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { configureVuexBridge } from './bridge/vuexBridgeConfig'
import { createVuexModulePiniaStore } from './bridge/createVuexModulePiniaStore'

export async function mount(props) {
  const pinia = createPinia()

  configureVuexBridge({
    getGlobalStore: () => (props.globalStore || window.Vuex || null)
  })

  // Create proxy for a specific module
  const useAuthStore = createVuexModulePiniaStore({
    id: 'legacy/auth',
    namespace: 'auth/'
  })

  const app = createApp(App)
  app.use(pinia)
  app.mount(props.container?.querySelector('#app') || '#app')
}
```

### In a Vue Component

```vue
<script>
import { createVuexModulePiniaStore } from './bridge/createVuexModulePiniaStore'

const useAuthStore = createVuexModulePiniaStore({
  id: 'legacy/auth',
  namespace: 'auth/'
})

export default {
  setup() {
    const authStore = useAuthStore()
    
    // Initialize synchronization with Vuex store
    authStore.$initSync()

    const login = async (credentials) => {
      await authStore.dispatchLocal('login', credentials)
    }

    const logout = () => {
      authStore.commitLocal('logout')
    }

    return {
      authStore,
      login,
      logout
    }
  }
}
</script>
```

## Tradeoffs

### Pros
- **Gradual Migration**: Migrate microfrontends incrementally without breaking existing Vuex 3 apps
- **State Consistency**: Single source of truth maintained in Vuex 3
- **Framework Agnostic Core**: Business logic can be extracted to framework-independent modules
- **Reactive**: Pinia stores stay in sync with Vuex mutations

### Cons
- **State Duplication**: Pinia stores duplicate Vuex state in memory
- **Subscription Overhead**: Each proxy store subscribes to all Vuex mutations
- **Global Coupling**: Tight coupling to a global store instance
- **Internal APIs**: Auto-registration uses Vuex internals that may change

## Limitations

### Qiankun Microfrontend Environment
- **No Shared Reactivity**: Vue 2 and Vue 3 have separate reactivity systems; this bridge provides synchronization but not true shared reactivity
- **Global Store Access**: Requires the global store to be accessible via props or `window`
- **Namespace Conflicts**: Pinia store IDs must be unique across the application

### Vuex 3 Specifics
- **Internal APIs**: `registerAllVuexModulesAsPinia` uses `_modulesNamespaceMap` which is not public API
- **Mutation Filtering**: Relies on mutation type prefixes for namespace filtering
- **No Direct State Access**: Pinia stores can't directly mutate Vuex state (must use `commitLocal`/`dispatchLocal`)

## Migration Strategy

1. **Setup Bridge**: Configure bridge in new Vue 3 microapps
2. **Create Proxies**: Create Pinia stores for needed Vuex modules
3. **Migrate Components**: Update components to use Pinia stores
4. **Extract Logic**: Move business logic to framework-agnostic services
5. **Gradual Migration**: Migrate Vuex modules to Pinia one by one
6. **Remove Bridge**: Once all modules migrated, remove bridge and global store

## Error Handling

The bridge includes defensive programming:
- Warns when global store is unavailable
- Warns when requested modules don't exist
- Gracefully handles missing configuration
- Avoids silent failures with console warnings

## Compatibility

- **Vue 2.7+** with **Vuex 3.x** (shell app)
- **Vue 3.x** with **Pinia** (microfrontends)
- **qiankun** microfrontend orchestrator
- **ES Modules** and modern JavaScript features