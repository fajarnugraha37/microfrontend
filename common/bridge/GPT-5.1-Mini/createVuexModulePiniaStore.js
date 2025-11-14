import { defineStore } from 'pinia'
import { getGlobalStore } from './vuexBridgeConfig'

/**
 * Create a Pinia store that proxies an existing Vuex module.
 *
 * @param {Object} options
 * @param {string} options.id - Pinia store id (e.g. 'legacy/auth')
 * @param {string} options.namespace - Vuex module namespace, including trailing slash or not (e.g. 'auth' or 'auth/')
 * @param {(state: any) => any} [options.mapState] - Optional mapper to shape the module state into Pinia state.
 * @param {(getters: any) => any} [options.mapGetters] - Optional mapper for Vuex getters to Pinia getters.
 * @returns {Function} - A `useXxxStore` function (Pinia store factory) that proxies the Vuex module.
 */
export function createVuexModulePiniaStore(options) {
  if (!options || typeof options.id !== 'string' || typeof options.namespace !== 'string') {
    throw new Error('[vuex-bridge] createVuexModulePiniaStore requires { id, namespace }')
  }

  const id = options.id
  // Normalize namespace: ensure no leading slash, allow trailing slash or not
  let ns = options.namespace
  ns = ns.replace(/^\/+/, '')
  const nsNoSlash = ns.replace(/\/$/, '')
  const nsPrefix = nsNoSlash ? nsNoSlash + '/' : ''

  /**
   * Safe accessor to current global Vuex store
   * @returns {import('vuex').Store<any>|null}
   */
  function _getStore() {
    return getGlobalStore()
  }

  // Default mappers: shallow mirror
  const mapState = typeof options.mapState === 'function'
    ? options.mapState
    : (s) => (Object.assign({}, s || {}))

  const mapGetters = typeof options.mapGetters === 'function'
    ? options.mapGetters
    : (g) => (g || {})

  // Define Pinia store
  const useStoreDef = defineStore(id, {
    state: () => ({
      // Pinia will hold a shallow mirror; actual source of truth is Vuex.
      // Start empty; will be patched on first use.
    }),
    getters: {
      // Dynamic getters will be mounted inside _buildGetters during init.
    },
    actions: {
      /**
       * Ensure bridge is connected: read initial Vuex module state and setup subscription.
       */
      _ensureBridge() {
        const gs = _getStore()
        if (!gs) {
          console.warn(`[vuex-bridge:${id}] No global Vuex store available`)
          return
        }

        // Check module state presence
        const moduleState = nsNoSlash ? gs.state[nsNoSlash] : gs.state
        if (nsNoSlash && typeof moduleState === 'undefined') {
          console.warn(`[vuex-bridge:${id}] Vuex module namespace '${nsNoSlash}' not found on global store`) 
        }

        // Apply initial state mapping
        try {
          const shaped = mapState(moduleState || {})
          if (shaped && typeof this.$patch === 'function') {
            this.$patch(Object.assign({}, shaped))
          }
        } catch (err) {
          console.warn(`[vuex-bridge:${id}] mapState threw:`, err)
        }

        // Build getters accessors (non-reactive proxies)
        try {
          const rawGetters = {}
          if (gs.getters) {
            // Collect getters for this module by prefix
            Object.keys(gs.getters).forEach((gk) => {
              if (nsPrefix && gk.indexOf(nsPrefix) === 0) {
                const short = gk.replace(nsPrefix, '')
                rawGetters[short] = () => gs.getters[gk]
              }
            })
          }
          const shapedGetters = mapGetters(rawGetters)
          // attach shaped getters as functions on this (non reactive), provide access via this.getters()
          this._bridgeGetters = shapedGetters || {}
        } catch (err) {
          console.warn(`[vuex-bridge:${id}] mapGetters threw:`, err)
        }

        // Subscribe to Vuex mutations to keep Pinia in sync
        if (!this._vuexUnsubscribe && typeof gs.subscribe === 'function') {
          this._vuexUnsubscribe = gs.subscribe((mutation, fullState) => {
            try {
              if (!mutation || !mutation.type) return
              // If mutation belongs to module namespace (prefix), update
              if (!nsPrefix || mutation.type.indexOf(nsPrefix) === 0) {
                const newModuleState = nsNoSlash ? fullState[nsNoSlash] : fullState
                if (newModuleState) {
                  const shaped = mapState(newModuleState)
                  // patch Pinia shallowly with new module state
                  this.$patch(Object.assign({}, shaped))
                }
              }
            } catch (err) {
              console.warn(`[vuex-bridge:${id}] Error in Vuex subscribe handler:`, err)
            }
          })
        }
      },

      /**
       * Read a getter value from the bridged Vuex getters (via configured mapGetters)
       * @param {string} key
       */
      readGetter(key) {
        if (this._bridgeGetters && typeof this._bridgeGetters[key] === 'function') {
          try {
            return this._bridgeGetters[key]()
          } catch (err) {
            console.warn(`[vuex-bridge:${id}] getter '${key}' threw:`, err)
          }
        }
        // Fallback: try direct Vuex getter
        const gs = _getStore()
        if (gs && gs.getters) {
          const full = nsPrefix + key
          return gs.getters[full]
        }
        return undefined
      },

      /**
       * Commit a Vuex mutation scoped to this module namespace.
       * @param {string} type - mutation type without namespace (e.g. 'SET_SOMETHING')
       * @param {any} payload
       */
      commitLocal(type, payload) {
        const gs = _getStore()
        if (!gs) {
          console.warn(`[vuex-bridge:${id}] commitLocal failed: no global store`)
          return
        }
        const full = nsPrefix + type
        try {
          gs.commit(full, payload)
        } catch (err) {
          console.warn(`[vuex-bridge:${id}] commitLocal '${full}' threw:`, err)
        }
      },

      /**
       * Dispatch a Vuex action scoped to this module namespace.
       * @param {string} type - action type without namespace
       * @param {any} payload
       * @returns {Promise<any>|void}
       */
      dispatchLocal(type, payload) {
        const gs = _getStore()
        if (!gs) {
          console.warn(`[vuex-bridge:${id}] dispatchLocal failed: no global store`)
          return
        }
        const full = nsPrefix + type
        try {
          return gs.dispatch(full, payload)
        } catch (err) {
          console.warn(`[vuex-bridge:${id}] dispatchLocal '${full}' threw:`, err)
        }
      },

      /**
       * Stop bridge subscription and cleanup.
       */
      stopBridge() {
        if (this._vuexUnsubscribe && typeof this._vuexUnsubscribe === 'function') {
          try { this._vuexUnsubscribe() } catch (e) {}
          this._vuexUnsubscribe = null
        }
        this._bridgeGetters = null
      }
    }
  })

  // Return a wrapper that ensures bridge init when the Pinia store is first used
  function useStoreWrapper(...args) {
    const store = useStoreDef(...args)
    if (!store._bridgeInitialized) {
      store._bridgeInitialized = true
      // call ensureBridge asynchronously to avoid blocking store creation
      try {
        store._ensureBridge()
      } catch (err) {
        console.warn(`[vuex-bridge:${id}] _ensureBridge threw:`, err)
      }
    }
    return store
  }

  return useStoreWrapper
}
