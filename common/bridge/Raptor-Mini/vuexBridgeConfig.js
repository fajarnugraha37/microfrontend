// vuexBridgeConfig.js

/**
 * @typedef {Object} VuexBridgeConfig
 * @property {() => import('vuex').Store<any> | null | undefined} getGlobalStore
 */

let bridgeConfig = {
  getGlobalStore: null,
}

/**
 * Configure the bridge with a custom getGlobalStore function.
 * @param {VuexBridgeConfig} config
 */
export function configureVuexBridge(config) {
  bridgeConfig = Object.assign({}, bridgeConfig, config || {})
}

/**
 * Return the configured global store or fall back to window.Vuex.
 * @returns {import('vuex').Store<any> | null}
 */
export function getGlobalStore() {
  try {
    const store = (bridgeConfig && bridgeConfig.getGlobalStore && bridgeConfig.getGlobalStore()) || (typeof window !== 'undefined' ? window.Vuex : null)

    if (!store) {
      // Safety: console warning but return null
      // eslint-disable-next-line no-console
      console.warn('[vuexBridge] Global Vuex store not found. Call configureVuexBridge or ensure window.Vuex or props.globalStore is provided.')
      return null
    }

    return store
  } catch (err) {
    // eslint-disable-next-line no-console
    console.warn('[vuexBridge] Error while getting global store:', err)
    return null
  }
}
