# Vuex-to-Pinia Bridge

This directory contains a runtime bridge to enable partial migration from Vuex 3 to Pinia in a qiankun-based microfrontend setup. The bridge is designed to work generically with any Vuex module and supports both Vue 2 and Vue 3 environments.

## Files

### 1. `vuexBridgeConfig.js`
Configures and retrieves the global Vuex store.
- Allows setting a custom `getGlobalStore` function.
- Falls back to `window.Vuex` if no store is provided.

### 2. `createVuexModulePiniaStore.js`
Creates Pinia stores that proxy Vuex modules.
- Supports mapping Vuex state and getters to Pinia.
- Provides methods to commit mutations and dispatch actions to Vuex.
- Keeps Pinia state in sync with Vuex via subscriptions.

### 3. `registerAllVuexModulesAsPinia.js`
Automatically registers Pinia stores for all Vuex modules.
- Inspects the Vuex store for namespaces.
- Creates a Pinia store for each Vuex module.

### 4. `exampleModule.js`
A generic Vuex module example to demonstrate compatibility.
- Includes state, mutations, actions, and getters.

## Usage

### 1. Configure the Bridge
Set up the bridge to access the global Vuex store:
```js
import { configureVuexBridge } from './vuexBridgeConfig';

configureVuexBridge({
  getGlobalStore: () => window.Vuex || null,
});
```

### 2. Create a Pinia Store for a Vuex Module
Create a Pinia store that proxies a Vuex module:
```js
import { createVuexModulePiniaStore } from './createVuexModulePiniaStore';

const useAuthStore = createVuexModulePiniaStore({
  id: 'legacy/auth',
  namespace: 'auth/',
});
```

### 3. Register All Vuex Modules as Pinia Stores
Automatically generate Pinia stores for all Vuex modules:
```js
import { registerAllVuexModulesAsPinia } from './registerAllVuexModulesAsPinia';

const piniaStores = registerAllVuexModulesAsPinia();
```

## Integration with qiankun

### Shell (Vue 2 + Vuex 3)
Expose the Vuex store globally:
```js
import Vue from 'vue';
import Vuex from 'vuex';
import { exampleModule } from './modules/exampleModule';

Vue.use(Vuex);

const store = new Vuex.Store({
  modules: {
    example: exampleModule,
  },
});

window.Vuex = store;
```

### Microfrontend (Vue 3 + Pinia)
Use the bridge in the microfrontend:
```js
import { createApp } from 'vue';
import { createPinia } from 'pinia';
import { configureVuexBridge } from './vuexBridgeConfig';

const app = createApp(App);
const pinia = createPinia();

configureVuexBridge({
  getGlobalStore: () => window.Vuex || null,
});

app.use(pinia);
app.mount('#app');
```

## Notes
- Ensure the global Vuex store is accessible via `window.Vuex` or passed through `qiankun` props.
- The bridge is designed to handle missing or misconfigured stores gracefully, with console warnings.

## License
MIT