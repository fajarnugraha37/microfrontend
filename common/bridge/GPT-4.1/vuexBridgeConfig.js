/**
 * @file vuexBridgeConfig.js
 * Bridge config for accessing the global Vuex store in qiankun microfrontends.
 * Supports both window.Vuex and props.globalStore.
 */

/**
 * @typedef {Object} VuexBridgeConfig
 * @property {() => import('vuex').Store<any> | null | undefined} getGlobalStore
 */

let _getGlobalStore = null

/**
 * Configure how to access the global Vuex store.
 * @param {VuexBridgeConfig} config
 */
export function configureVuexBridge(config) {
  if (typeof config.getGlobalStore === 'function') {
    _getGlobalStore = config.getGlobalStore
  } else {
    console.warn('[VuexBridge] configureVuexBridge: getGlobalStore must be a function')
  }
}

/**
 * Get the global Vuex store instance.
 * Falls back to window.Vuex if not configured.
 * @returns {import('vuex').Store<any> | null}
 */
export function getGlobalStore() {
  if (_getGlobalStore) {
    const store = _getGlobalStore()
    if (store) return store
  }
  if (typeof window !== 'undefined' && window.Vuex) {
    return window.Vuex
  }
  console.warn('[VuexBridge] No global Vuex store found (getGlobalStore returned null, window.Vuex missing)')
  return null
}
