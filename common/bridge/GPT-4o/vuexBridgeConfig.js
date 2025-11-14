/**
 * @typedef {Object} VuexBridgeConfig
 * @property {() => import('vuex').Store<any> | null | undefined} getGlobalStore
 */

let globalConfig = {
  getGlobalStore: () => window.Vuex || null,
};

/**
 * Configures the Vuex bridge with a custom global store getter.
 * @param {VuexBridgeConfig} config
 */
export function configureVuexBridge(config) {
  if (config && typeof config.getGlobalStore === 'function') {
    globalConfig.getGlobalStore = config.getGlobalStore;
  } else {
    console.warn('[VuexBridge] Invalid configuration provided. Falling back to default.');
  }
}

/**
 * Retrieves the global Vuex store instance.
 * @returns {import('vuex').Store<any> | null}
 */
export function getGlobalStore() {
  const store = globalConfig.getGlobalStore();
  if (!store) {
    console.warn('[VuexBridge] Global Vuex store is not available.');
  }
  return store;
}