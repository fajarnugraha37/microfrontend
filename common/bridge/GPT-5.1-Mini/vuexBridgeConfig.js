/**
 * Bridge configuration for locating the global Vuex store.
 * @module vuexBridgeConfig
 */

/** @type {{getGlobalStore: Function|null}} */
const _config = {
  getGlobalStore: null,
}

/**
 * @typedef {Object} VuexBridgeConfig
 * @property {() => import('vuex').Store<any> | null | undefined} getGlobalStore
 */

/**
 * Configure the Vuex bridge.
 * @param {VuexBridgeConfig} config
 */
export function configureVuexBridge(config) {
  if (!config || typeof config.getGlobalStore !== 'function') {
    console.warn('[vuex-bridge] configureVuexBridge expects an object with getGlobalStore()')
    _config.getGlobalStore = null
    return
  }
  _config.getGlobalStore = config.getGlobalStore
}

/**
 * Attempt to return the global Vuex store.
 * Falls back to `window.Vuex` if no configured getter exists.
 * @returns {import('vuex').Store<any> | null}
 */
export function getGlobalStore() {
  try {
    if (_config.getGlobalStore) {
      const s = _config.getGlobalStore()
      if (s) return s
    }
  } catch (err) {
    console.warn('[vuex-bridge] getGlobalStore() threw:', err)
  }

  // Fallback to window.Vuex for qiankun or global injection scenarios
  if (typeof window !== 'undefined' && window.Vuex) {
    return window.Vuex
  }

  console.warn('[vuex-bridge] No global Vuex store found (configureVuexBridge or set window.Vuex)')
  return null
}
