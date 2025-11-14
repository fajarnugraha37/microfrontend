/**
 * Configuration for accessing the global Vuex store in a qiankun microfrontend environment.
 * This module provides a way to configure how to retrieve the global Vuex store instance,
 * supporting both qiankun props and window.Vuex fallback.
 */

/**
 * @typedef {Object} VuexBridgeConfig
 * @property {() => import('vuex').Store<any> | null | undefined} getGlobalStore - Function to retrieve the global Vuex store
 */

/** @type {VuexBridgeConfig | null} */
let bridgeConfig = null;

/**
 * Configure the Vuex bridge with a custom way to access the global store.
 * This is typically called in the microapp's mount function with access to qiankun props.
 *
 * @param {VuexBridgeConfig} config - Configuration object containing getGlobalStore function
 */
export function configureVuexBridge(config) {
  if (typeof config.getGlobalStore !== 'function') {
    console.warn('[VuexBridge] configureVuexBridge: getGlobalStore must be a function');
    return;
  }
  bridgeConfig = config;
}

/**
 * Get the global Vuex store instance.
 * First tries the configured getGlobalStore function, then falls back to window.Vuex.
 * Returns null if neither is available.
 *
 * @returns {import('vuex').Store<any> | null} The global Vuex store or null if not available
 */
export function getGlobalStore() {
  if (bridgeConfig && typeof bridgeConfig.getGlobalStore === 'function') {
    const store = bridgeConfig.getGlobalStore();
    if (store) {
      return store;
    }
  }

  if (window.Vuex) {
    return window.Vuex;
  }

  console.warn('[VuexBridge] getGlobalStore: No global Vuex store available. Make sure to configure the bridge or set window.Vuex.');
  return null;
}