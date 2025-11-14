import { defineStore } from 'pinia'
import { getGlobalStore } from './vuexBridgeConfig.js'

/**
 * @typedef {Object} CreateVuexModulePiniaStoreOptions
 * @property {string} id - Pinia store id (e.g. 'legacy/auth')
 * @property {string} namespace - Vuex module namespace, with trailing slash (e.g. 'auth/' or 'exam/')
 * @property {(state: any) => any} [mapState] - Optional mapper for module state
 * @property {(getters: any) => any} [mapGetters] - Optional mapper for module getters
 */

/**
 * Create a Pinia store that proxies an existing Vuex module.
 * @param {CreateVuexModulePiniaStoreOptions} options
 * @returns {import('pinia').StoreDefinition}
 */
export function createVuexModulePiniaStore(options) {
  const { id, namespace, mapState, mapGetters } = options
  if (!id || !namespace) {
    throw new Error('[VuexBridge] createVuexModulePiniaStore: id and namespace are required')
  }
  const ns = namespace.endsWith('/') ? namespace : namespace + '/'
  const nsKey = ns.slice(0, -1)

  return defineStore(id, {
    state: () => {
      const store = getGlobalStore()
      if (!store) {
        console.warn(`[VuexBridge] No global Vuex store for Pinia store ${id}`)
        return {}
      }
      const moduleState = store.state[nsKey]
      if (!moduleState) {
        console.warn(`[VuexBridge] Vuex module namespace '${nsKey}' not found in store.state`)
        return {}
      }
      return mapState ? mapState(moduleState) : { ...moduleState }
    },
    getters: mapGetters
      ? {
          ...mapGettersProxy(ns, mapGetters)
        }
      : {
          // Default: shallow proxy of all Vuex getters for this namespace
          ...defaultGettersProxy(ns)
        },
    actions: {
      /**
       * Commit a mutation to the Vuex module.
       * @param {string} mutation - Mutation name (without namespace)
       * @param {any} payload
       */
      commitLocal(mutation, payload) {
        const store = getGlobalStore()
        if (!store) return
        store.commit(ns + mutation, payload)
      },
      /**
       * Dispatch an action to the Vuex module.
       * @param {string} action - Action name (without namespace)
       * @param {any} payload
       */
      dispatchLocal(action, payload) {
        const store = getGlobalStore()
        if (!store) return
        return store.dispatch(ns + action, payload)
      },
      /**
       * Internal: Sync Pinia state with Vuex on mutation.
       * Called automatically on relevant Vuex mutations.
       * @private
       */
      _syncState() {
        const store = getGlobalStore()
        if (!store) return
        const moduleState = store.state[nsKey]
        if (!moduleState) return
        Object.assign(this.$state, mapState ? mapState(moduleState) : { ...moduleState })
      }
    }
  })
}

/**
 * Default: shallow proxy of all Vuex getters for a namespace.
 * @param {string} ns
 * @returns {Object}
 */
function defaultGettersProxy(ns) {
  return new Proxy({}, {
    get(target, prop) {
      const store = getGlobalStore()
      if (!store) return undefined
      const getterKey = ns + prop
      return store.getters[getterKey]
    }
  })
}

/**
 * Custom proxy for mapped getters.
 * @param {string} ns
 * @param {(getters: any) => any} mapGetters
 * @returns {Object}
 */
function mapGettersProxy(ns, mapGetters) {
  return mapGetters(
    new Proxy({}, {
      get(target, prop) {
        const store = getGlobalStore()
        if (!store) return undefined
        const getterKey = ns + prop
        return store.getters[getterKey]
      }
    })
  )
}

// --- Vuex subscription: sync Pinia state on mutation ---
// This must be called in the microapp entry after Pinia store creation
// Example: useSomeStore._subscribeToVuexMutations()

/**
 * Subscribe Pinia store to Vuex mutations for syncing state.
 * @param {import('pinia').Store} piniaStore
 * @param {string} namespace
 */
export function subscribePiniaToVuexMutations(piniaStore, namespace) {
  const store = getGlobalStore()
  if (!store || typeof store.subscribe !== 'function') return
  const ns = namespace.endsWith('/') ? namespace : namespace + '/'
  const nsKey = ns.slice(0, -1)
  store.subscribe((mutation, state) => {
    if (mutation.type.startsWith(ns)) {
      // Only sync if the relevant module changed
      piniaStore._syncState()
    }
  })
}
