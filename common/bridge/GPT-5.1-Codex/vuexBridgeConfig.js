/**
 * Global configuration holder for the Vuex ⇔ Pinia bridge.
 * The bridge defaults to `window.Vuex` but allows the consumer (usually a qiankun microapp)
 * to supply a getter that returns the host's Vuex store instance.
 *
 * @module vuexBridgeConfig
 */

let configuredGetter = null;
let hasWarnedAboutMissingStore = false;

/**
 * @typedef {Object} VuexBridgeConfig
 * @property {() => import('vuex').Store<any> | null | undefined} getGlobalStore
 */

/**
 * Configure how the bridge resolves the global Vuex store at runtime.
 *
 * @param {VuexBridgeConfig} config
 */
export function configureVuexBridge(config) {
  if (!config || typeof config.getGlobalStore !== 'function') {
    console.warn(
      '[vuex-pinia-bridge] configureVuexBridge called without a valid getGlobalStore function.'
    );
    configuredGetter = null;
    return;
  }
  configuredGetter = config.getGlobalStore;
}

/**
 * Attempt to resolve the shared Vuex store.
 *
 * @returns {import('vuex').Store<any> | null}
 */
export function getGlobalStore() {
  let store = null;
  try {
    if (configuredGetter) {
      store = configuredGetter() || null;
    }
  } catch (error) {
    console.warn('[vuex-pinia-bridge] getGlobalStore getter threw an error:', error);
  }

  if (!store && typeof window !== 'undefined' && window && window.Vuex) {
    store = window.Vuex;
  }

  if (!store && !hasWarnedAboutMissingStore) {
    console.warn(
      '[vuex-pinia-bridge] No global Vuex store found. Configure the bridge or attach store to window.Vuex.'
    );
    hasWarnedAboutMissingStore = true;
  }

  return store || null;
}
