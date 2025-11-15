import { productStore } from './product';
import { authStore } from './auth';
import { globalStore } from './global';
import { createVuexModulePiniaStore, registerAllVuexModulesAsPinia } from './bridge'
import { getGlobalStore } from './bridge/vuexBridgeConfig'

export * from "./bridge";

// -----------------------------------------------------------------------------
// Vuex and Pinia store setup helpers
// -----------------------------------------------------------------------------
/**
 * 
 * @param {import('vue').VueConstructor} vue 
 */
export const useVuexStore = window.useVuexStore = (vue) => {
  vue.use(new class VuexStorePlugin {
    install(Vue) {
      Vue.use(window.Vuex);
      /** @type {import('vuex').Store} */
      const store = new window.Vuex.Store(globalStore);
      // expose a consistent globalStore pointer for bridging convenience
      window.store = store;
      window.globalStore = store;

      store.registerModule('auth', authStore);
      store.registerModule('product', productStore);

      store.subscribe((mutation, state) => {
        // eslint-disable-next-line no-console
        console.log(`[Vuex] Mutation: ${mutation.type}`, JSON.stringify(state));
        console.log(`[Vuex] Mutation: ${Object.keys(mutation.payload).join(', ')}`);
      });
      store.watch(
        (state) => state.auth.token,
        (newToken) => {
          // eslint-disable-next-line no-console
          console.log('[Vuex] Auth token changed:', newToken);
        }
      );
    }
  });
}


/**
 * 
 * @param {import('vue').VueConstructor} vue 
 */
export const usePiniaStore = window.usePiniaStore = (defineStore) = (vue) => {
  vue.use(new class PiniaStorePlugin {
    install(Vue) {
      Vue.use(createPiniaBridgeStores(defineStore, Vue.reactive, Vue.toRefs, Vue.computed, { 
        modules: ['auth', 'product'] 
      }));
    }
  });
}

// -----------------------------------------------------------------------------
// Convenience helper used by microfrontends migrating to Pinia.
// - Use createPiniaBridgeStores(pinia) after you have created and installed `pinia`.
// - It returns a map of namespace => Pinia store factory (useX) functions that you can call
//   inside your components to obtain reactive Pinia stores that are backed by the global Vuex store.
// Example (Vue 3 microapp):
// import { createPinia } from 'pinia'
// import { createPiniaBridgeStores } from 'common/src/store'
// const pinia = createPinia()
// app.use(pinia)
// const factories = createPiniaBridgeStores(pinia)
// const useAuth = factories['auth/']
// const authStore = useAuth() // reactive Pinia store referencing Vuex module data
// -----------------------------------------------------------------------------


/**
 * Create Pinia bridge store factories for selected Vuex modules or all modules.
 *
 * Example usage in a Vue 3 microapp:
 *
 * import { createPinia } from 'pinia'
 * import { createPiniaBridgeStores } from 'common/src/store'
 * const pinia = createPinia()
 * const factories = createPiniaBridgeStores(pinia)
 * // use factory inside components `const useAuth = factories['auth/']; const auth = useAuth()`
 *
 * @param {import('pinia').defineStore} defineStore
 * @param {import('vue').reactive} reactive
 * @param {import('vue').toRefs} toRefs
 * @param {import('vue').computed} computed
 * @param {{ modules?: string[] }} [options]
 * @returns {Object<string, Function>} map of namespace => Pinia factory function (useX store)
 */
export const createPiniaBridgeStores = window.createPiniaBridgeStores = (defineStore, reactive, toRefs, computed, { modules } = {}) => {
  // Ensure the bridge uses the same global store if available
  const globalStore = getGlobalStore()
  if (!globalStore) {
    // eslint-disable-next-line no-console
    console.warn('[createPiniaBridgeStores] global Vuex store not found. Make sure configureVuexBridge is called with `getGlobalStore` or window.Vuex is set.')
  }

  const map = {}
  if (!modules) {
    // auto-generate for all Vuex namespaced modules
    const all = registerAllVuexModulesAsPinia(defineStore, reactive, toRefs, computed)
    Object.keys(all).forEach((ns) => {
      map[ns] = all[ns]
    })
    return map
  }

  // selected modules only
  modules.forEach((ns) => {
    // normalize namespace
    const normalized = ns.endsWith('/') ? ns : `${ns}/`
    // derive an id
    const id = `legacy/${normalized.replace(/\/+$/, '').replace(/\//g, '-')}`
    map[normalized] = createVuexModulePiniaStore({ id, namespace: normalized }, defineStore, reactive, toRefs, computed)
  })
  return map
}