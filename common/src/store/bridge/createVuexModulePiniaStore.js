import { getGlobalStore } from './vuexBridgeConfig'

/**
 * @typedef {Object} CreateVuexModulePiniaStoreOptions
 * @property {string} id - Pinia store id (e.g. 'legacy/auth')
 * @property {string} namespace - Vuex module namespace, with or without trailing slash (e.g. 'auth' or 'auth/')
 * @property {(state: any) => any} [mapState] - Optional mapper to shape the module state into Pinia state.
 * @property {(getters: any) => any} [mapGetters] - Optional mapper for Vuex getters to Pinia getters.
 */

/**
 * Helper to get module state by namespace from Vuex store.
 * @param {import('vuex').Store<any>} store
 * @param {string} namespace
 */
function getModuleState(store, namespace) {
  if (!store || !namespace) return null
  // normalize: remove trailing slash if provided
  // special support for root store
  if (namespace === '<root>' || namespace === 'root' || namespace === '/' || namespace === '') {
    return store.state
  }
  const ns = namespace.endsWith('/') ? namespace.slice(0, -1) : namespace
  const path = ns.split('/') // supports nested modules
  // traverse store.state path
  let state = store.state
  for (let i = 0; i < path.length; i++) {
    const key = path[i]
    if (state && Object.prototype.hasOwnProperty.call(state, key)) {
      state = state[key]
    } else {
      return null
    }
  }
  return state
}

/**
 * Helper to get module getters by namespace and map them as an object.
 * @param {import('vuex').Store<any>} store
 * @param {string} namespace
 */
function getModuleGetters(store, namespace) {
  if (!store || !store.getters) return {}
  const prefix = namespace.endsWith('/') ? namespace : `${namespace}/`
  const getters = {}
  // Vuex stores flattened getters in store.getters with keys like 'namespace/getterName'
  Object.keys(store.getters).forEach((gKey) => {
    if (gKey.startsWith(prefix)) {
      const shortKey = gKey.slice(prefix.length)
      Object.defineProperty(getters, shortKey, {
        enumerable: true,
        get() {
          return store.getters[gKey]
        },
      })
    }
  })
  return getters
}

// internal: keep track of created subscriptions per namespace to avoid duplicate subscriptions
// structure: { [namespace]: { unsubscribe: Function, refCount: number } }
const _namespaceSubscriptions = {}

/**
 * Create a Pinia store that mirrors a Vuex module.
 * It reads module state and getters from the configured global Vuex store and
 * offers generic methods to dispatch/commit to Vuex.
 *
 * @param {CreateVuexModulePiniaStoreOptions} options
 * @param {import('pinia').defineStore} defineStore
 * @param {import('vue').reactive} reactive
 * @param {import('vue').toRefs} toRefs
 * @param {import('vue').computed} computed
 * @returns {function(): import('pinia').StoreDefinition}
 */
export function createVuexModulePiniaStore(options, defineStore, reactive, toRefs, computed) {
  const {
    id,
    namespace,
    mapState,
    mapGetters,
  } = options || {}

  if (!id || !namespace) {
    throw new Error('[createVuexModulePiniaStore] id and namespace are required')
  }

  return defineStore(id, () => {
    const globalStore = getGlobalStore()

    if (!globalStore) {
      // No global store, provide fallback store state and methods that log warnings
      const state = (mapState && mapState({})) || {}
      const getters = (mapGetters && mapGetters({})) || {}
      /**
       * Fallback commitLocal
       */
      function commitLocal(type, payload) {
        // eslint-disable-next-line no-console
        console.warn(`[pinia-vuex-bridge:${id}] commitLocal called, but global Vuex store is not available. (${type})`)
      }

      function dispatchLocal(type, payload) {
        // eslint-disable-next-line no-console
        console.warn(`[pinia-vuex-bridge:${id}] dispatchLocal called, but global Vuex store is not available. (${type})`)
      }

      return {
        ...state,
        // expose getters
        ...getters,
        commitLocal,
        dispatchLocal,
        __isBridgeFallback: true,
      }
    }

    // When globalStore exists, locate module state
    const moduleState = getModuleState(globalStore, namespace)
    if (!moduleState) {
      // eslint-disable-next-line no-console
      console.warn(`[pinia-vuex-bridge:${id}] Vuex module for namespace "${namespace}" not found.`)
    }

    // initial mapped state (as a reactive Pinia state source)
    const rawState = moduleState || {}
    const initialState = (mapState && mapState(rawState)) || { ...(rawState || {}) }
    const piniaState = reactive({ ...initialState })

    // getters that proxy to Vuex getters; expose both raw values and computed refs
    const rawGetters = getModuleGetters(globalStore, namespace)
    const getters = (mapGetters && mapGetters(rawGetters)) || { ...rawGetters }
    // computed getters for reactivity
    const computedGetters = {}
    {
      const prefix = namespace.endsWith('/') ? namespace : `${namespace}/`
      Object.keys(rawGetters).forEach((gKey) => {
        // rawGetters has keys like getterName; use globalStore.getters[namespace+getterName]
        computedGetters[gKey] = computed(() => {
          const fullKey = `${prefix}${gKey}`
          return globalStore.getters && globalStore.getters[fullKey]
        })
      })
    }

    // commitLocal/dispatchLocal implementation
    function commitLocal(type, payload) {
      const commitType = namespace.endsWith('/') ? `${namespace}${type}` : `${namespace}/${type}`
      try {
        globalStore.commit(commitType, payload)
      } catch (err) {
        // eslint-disable-next-line no-console
        console.warn(`[pinia-vuex-bridge:${id}] commitLocal error:`, err)
      }
    }

    function dispatchLocal(type, payload) {
      const dispatchType = namespace.endsWith('/') ? `${namespace}${type}` : `${namespace}/${type}`
      try {
        return globalStore.dispatch(dispatchType, payload)
      } catch (err) {
        // eslint-disable-next-line no-console
        console.warn(`[pinia-vuex-bridge:${id}] dispatchLocal error:`, err)
        return Promise.resolve(null)
      }
    }

    // Pinia state as reactive object
    const state = piniaState

    // maintain getters under a $bridgeGetters object to avoid conflict with state keys
    // expose both value getters and computed refs for convenience
    const $bridgeGetters = {}
    Object.keys(getters).forEach((k) => {
      Object.defineProperty($bridgeGetters, k, {
        enumerable: true,
        get() {
          return getters[k]
        },
      })
    })
    const $bridgeGettersComputed = {}
    Object.keys(computedGetters).forEach((k) => {
      $bridgeGettersComputed[k] = computedGetters[k]
    })

    // Subscribe to Vuex mutations for updates
    // Ensure we only subscribe once per namespace to avoid duplicate updates
    if (globalStore && typeof globalStore.subscribe === 'function') {
      if (!_namespaceSubscriptions[namespace]) {
        const unsubscribe = globalStore.subscribe((mutation, rootState) => {
          const type = mutation.type || ''
          const prefix = namespace.endsWith('/') ? namespace : `${namespace}/`
          if (!type.startsWith(prefix)) return // ignore non module mutations
          // gather new module state
          const newModuleState = getModuleState(globalStore, namespace)
          if (!newModuleState) return
          // compute mapped state and patch store
          const mapped = (mapState && mapState(newModuleState)) || { ...newModuleState }
          // patch the reactive state object: this is a shallow patch; if you need deep diffing, add custom logic
          subscriptionPatch(mapped)
        })
        _namespaceSubscriptions[namespace] = { unsubscribe, refCount: 1 }
      } else {
        // increment reference counter if same module is mapped multiple times
        _namespaceSubscriptions[namespace].refCount += 1
      }
    }

    // subscriptionPatch is a helper that moves mapped keys to state reference
    function subscriptionPatch(mapped) {
      // update/replace keys on state; avoid replacing the entire reference so Vue reactivity is preserved
      Object.keys(mapped).forEach((k) => {
        // If a nested object changed, we set it as a new value; it's the consumer's responsibility to use stable object shapes.
        state[k] = mapped[k]
      })
      // remove keys that are no longer present in mapped
      Object.keys(state).forEach((k) => {
        if (!Object.prototype.hasOwnProperty.call(mapped, k)) {
          delete state[k]
        }
      })
    }

    // Expose a function to stop the subscription (decrement refCount and unsubscribe when zero)
    function stopBridge() {
      const entry = _namespaceSubscriptions[namespace]
      if (!entry) return
      entry.refCount -= 1
      if (entry.refCount <= 0) {
        try {
          entry.unsubscribe && entry.unsubscribe()
        } catch (err) {
          // ignore
        }
        delete _namespaceSubscriptions[namespace]
      }
    }

    return {
      ...toRefs(state),
      $bridgeGetters,
      $bridgeGettersComputed,
      commitLocal,
      dispatchLocal,
      stopBridge,
      __isBridge: true,
    }
  })
}
