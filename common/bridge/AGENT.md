You are a senior Vue + JavaScript architect.

I want you to design and implement a **runtime bridge between Vuex 3 and Pinia**, to support a partial migration scenario in a **qiankun-based microfrontend** setup.

The bridge must be **generic**: it should work with **any Vuex module** (namespaced or not), and ideally be able to handle **the entire Vuex store**, not just a single hard-coded module.
Just create the bridge in /common/bridge/GPT-5.1-Codex

---

## Context

### Technologies

- Legacy shell app (host):
  - Vue 2.7.x
  - Vuex 3.x
  - Uses **qiankun** as microfrontend orchestrator (host/master).
  - Has a **single global Vuex 3 store instance** that contains multiple modules
    (for example `auth`, `profile`, `exam`, `candidate`, etc).

- Child microfrontends:
  - Some are **Vue 2 + Vuex 3**.
  - New ones will be **Vue 3 + Pinia**.
  - All are loaded and controlled by **qiankun** (`bootstrap`, `mount`, `unmount`).

### Global store sharing

The global Vuex store from the shell app is available to children via **one or both** patterns:

1. **Global window**:
   ```js
   window.Vuex = store
````

2. **qiankun props**:

   * The shell passes the store (and possibly other shared services) through qiankun microapp `props`:

     ```js
     registerMicroApps([
       {
         name: 'some-app',
         entry: '...',
         container: '#subapp-container',
         activeRule: '/some',
         props: {
           globalStore: store,
           // other shared services...
         },
       },
     ])
     ```

   * In the child app’s `mount(props)` lifecycle, we can access `props.globalStore`.

---

## Goals

I want to:

1. Keep the existing **Vuex 3 store** (including all modules) as the canonical “legacy backend” for shared/global state and business logic (at least for now).
2. In new **Vue 3 + Pinia** microfrontends, expose **Pinia stores** that internally **proxy to the global Vuex 3 store**:

   * Not tied to a specific module name.
   * Able to work with arbitrary modules and tree structure.
3. Allow a clean path to gradually move logic into Pinia / framework-agnostic core code, without breaking existing Vuex 3–based apps (including Vue 2 microfrontends).
4. Support both ways of getting the global store:

   * from `window.Vuex`, and
   * from qiankun `props.globalStore`.

Think of Vuex 3 as a “backend state engine”, and Pinia stores in Vue 3 microfrontends as “adapters/facades” that can reflect and manipulate that state.

---

## Constraints

* **Use plain JavaScript** (no TypeScript syntax).
* Use **JSDoc for type safety** and developer experience (type hints, etc).
* Code must be compatible with:

  * Vue 2.7 + Vuex 3 in the shell and legacy MFEs.
  * Vue 3.x + Pinia in new MFEs.
* This runs in a **qiankun** environment:

  * Each microapp implements `bootstrap`, `mount`, and `unmount`.
  * New Vue 3 microapps will use Pinia.
  * The bridge layer should be usable inside these microapp entry files.

---

## What I Want You to Build

Design and implement a **small, production-grade bridge layer** that enables:

### 1. Generic Vuex 3 → Pinia bridge for ANY module (and entire store)

I want a generic API that lets me create Pinia proxies for Vuex modules.

Design something along these lines (you can refine the API if you have a better design):

1. A **bridge config module** that controls how to access the global Vuex store:

   ```js
   // bridge/vuexBridgeConfig.js
   /**
    * @typedef {Object} VuexBridgeConfig
    * @property {() => import('vuex').Store<any> | null | undefined} getGlobalStore
    */

   /**
    * @param {VuexBridgeConfig} config
    */
   export function configureVuexBridge(config) { ... }

   /**
    * @returns {import('vuex').Store<any> | null}
    */
   export function getGlobalStore() { ... }
   ```

   * If `getGlobalStore` is not configured, it should fall back to `window.Vuex`.
   * If neither is available, it should log a warning and return `null`.

2. A **factory to create Pinia stores that mirror Vuex modules**, e.g.:

   ```js
   // bridge/createVuexModulePiniaStore.js
   import { defineStore } from 'pinia'

   /**
    * Create a Pinia store that proxies an existing Vuex module.
    *
    * @param {Object} options
    * @param {string} options.id - Pinia store id (e.g. 'legacy/auth')
    * @param {string} options.namespace - Vuex module namespace, including trailing slash (e.g. 'auth/' or 'exam/').
    * @param {(state: any) => any} [options.mapState] - Optional mapper to shape the module state into Pinia state.
    * @param {(getters: any) => any} [options.mapGetters] - Optional mapper for Vuex getters to Pinia getters.
    * @returns {import('pinia').StoreDefinition}
    */
   export function createVuexModulePiniaStore(options) { ... }
   ```

   Requirements:

   * It should:

     * Read the Vuex module state via `globalStore.state[namespaceWithoutSlash]`.
     * Optionally read the module getters via `globalStore.getters[namespace + getterName]`.

   * It should:

     * Provide default behavior if `mapState` / `mapGetters` are not provided (e.g. shallow mirror).

   * For writes:

     * Provide generic methods to call Vuex mutations and actions by type:

       * e.g. `commitLocal('SET_SOMETHING', payload)` dispatches `globalStore.commit(namespace + 'SET_SOMETHING', payload)`.
       * e.g. `dispatchLocal('LOAD_SOMETHING', payload)` dispatches `globalStore.dispatch(namespace + 'LOAD_SOMETHING', payload)`.

   * It should **keep Pinia state in sync with Vuex** by:

     * Subscribing to `globalStore.subscribe((mutation, state) => { ... })`.
     * Filtering by `mutation.type` prefix (module namespace).
     * Updating Pinia state when the relevant module changes.

   * It must gracefully handle:

     * `getGlobalStore()` returning `null`.
     * The requested namespace not existing in the Vuex store.

3. (Optional but nice) A helper that can **auto-generate Pinia stores for all Vuex modules** by introspecting the Vuex store:

   ```js
   // bridge/registerAllVuexModulesAsPinia.js
   /**
    * Inspects the global Vuex store and registers Pinia stores for each namespaced module.
    * You can rely on Vuex internals like _modulesNamespaceMap if needed.
    *
    * @returns {Object<string, import('pinia').StoreDefinition>} map of [namespace]: storeDefinition
    */
   export function registerAllVuexModulesAsPinia() { ... }
   ```

   * This is allowed to use non-public Vuex internals like `store._modulesNamespaceMap` for pragmatic reasons.
   * Document the tradeoffs.

### 2. Clear separation of core logic vs framework glue (generic)

Instead of hardcoding any specific domain (like “user” or “auth”), design a **generic pattern**:

* Core logic can live in 「service」 / 「domain」 modules that:

  * Don’t know about Vuex or Pinia.
  * Receive plain objects and return plain objects.
* The bridge layer can optionally call these core functions.
* You don’t have to implement complex domain logic; just set up a **clear, generic pattern** that would make it easy to move domain logic out of Vuex/Pinia.

### 3. Vuex 3 module reusability (3 ↔ 4)

Show that the Vuex module definitions you expect are compatible with both Vuex 3 and Vuex 4:

* Use a plain object structure:

  ```js
  export const someModule = {
    namespaced: true,
    state: () => ({ ... }),
    mutations: { ... },
    getters: { ... },
    actions: { ... },
  }
  ```
* Give one small generic example module (e.g. `exampleModule`) just to demonstrate compatibility and how the bridge would see it.
* But DO NOT hard-code the bridge to that module; the bridge must remain generic and able to work with any module name.

### 4. qiankun integration

Show how this bridge is integrated in a qiankun microfrontend setup.

1. **Shell (Vue 2 + Vuex 3)**

   * Create the global Vuex store, attach it to:

     * `window.Vuex`.
     * `props.globalStore` when registering microapps in qiankun.

   * Example (generic, not tied to any domain):

     ```js
     // shell/store.js
     import Vue from 'vue'
     import Vuex from 'vuex'
     import { someModule } from './modules/someModule'
     // possibly more modules...

     Vue.use(Vuex)

     const store = new Vuex.Store({
       strict: process.env.NODE_ENV !== 'production',
       modules: {
         some: someModule,
         // other modules...
       },
     })

     window.Vuex = store

     export default store
     ```

     ```js
     // shell/qiankun.js
     import store from './store'

     registerMicroApps([
       {
         name: 'some-app',
         entry: '...',
         container: '#subapp-container',
         activeRule: '/some',
         props: {
           globalStore: store,
         },
       },
       // other apps...
     ])
     ```

2. **New Vue 3 + Pinia microapp**

   * In the microapp’s `mount(props)`:

     * Create Vue 3 app, create Pinia.
     * Configure the bridge with a `getGlobalStore` function that:

       * First tries `props.globalStore`.
       * Falls back to `window.Vuex`.

   * Example:

     ```js
     // microapp/main.js (Vue 3 + Pinia + qiankun)
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
         getGlobalStore: () =>
           (props && props.globalStore) ||
           window.Vuex ||
           null,
       })

       // Example: create a Pinia store that proxies a Vuex module with namespace "some/"
       const useSomeStore = createVuexModulePiniaStore({
         id: 'legacy/some',
         namespace: 'some/',
       })

       app = createApp(App)
       app.use(pinia)
       app.mount(
         props.container
           ? props.container.querySelector('#app')
           : '#app'
       )

       // Example usage in setup(): const someStore = useSomeStore()
     }

     export async function unmount(props) {
       if (app) {
         app.unmount()
         app = null
       }
       pinia = null
     }
     ```

   * Also provide a small example Vue 3 component that:

     * Uses one of these generated Pinia bridge stores (`useSomeStore`).
     * Reads some state/getters.
     * Calls a generic `commitLocal` / `dispatchLocal` to mutate via Vuex 3.

---

## Technical Requirements

* **Plain JavaScript**, ES modules.

* Use **JSDoc** for types:

  * `@typedef`, `@property`, `@param`, `@returns`, etc.
  * Enough to give good IntelliSense in editors (VS Code, WebStorm).

* Focus on:

  * Generic bridge logic (no hard-coded domain like “user”).
  * Handling **all Vuex modules / the full store**, via:

    * Per-module factory (`createVuexModulePiniaStore`).
    * Optional auto-registration helper (`registerAllVuexModulesAsPinia`).

* Add basic safety:

  * Clear console warnings if:

    * The global store is missing.
    * A namespace does not exist.
  * Avoid silent failures.

* No pseudo-code. I want **real, runnable JavaScript** with JSDoc.

* Briefly explain:

  * How the bridge works.
  * How it leverages Vuex internals (if needed).
  * Tradeoffs (duplication of state vs direct reads, subscription overhead, coupling to a global store).
  * Limitations in a qiankun microfrontend world (e.g., no single shared reactivity graph across Vue 2 and Vue 3; this is necessarily a bridge, not magic).

Focus on correctness, clarity, and realistic patterns that I can drop into a real monorepo.