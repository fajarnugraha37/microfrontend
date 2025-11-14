import { createVuexModulePiniaStore } from './createVuexModulePiniaStore.js';
import { getGlobalStore } from './vuexBridgeConfig.js';

/**
 * Inspects the global Vuex store and registers Pinia stores for each namespaced module.
 * This function uses Vuex internals (_modulesNamespaceMap) to discover available modules.
 * Note: This relies on non-public Vuex internals, which may change between versions.
 *
 * Tradeoffs:
 * - Pros: Automatic discovery and registration of all modules
 * - Cons: Relies on internal Vuex APIs that may break in future versions
 * - Cons: Creates stores for all modules whether needed or not
 * - Cons: No control over store IDs or mapping functions
 *
 * @returns {Object<string, import('pinia').StoreDefinition>} Map of namespace -> Pinia store definition
 */
export function registerAllVuexModulesAsPinia() {
  const globalStore = getGlobalStore();
  if (!globalStore) {
    console.warn('[VuexBridge] registerAllVuexModulesAsPinia: No global store available');
    return {};
  }

  const storeDefinitions = {};

  // Access Vuex internal _modulesNamespaceMap to get all namespaced modules
  // This is a pragmatic approach but relies on internal APIs
  if (globalStore._modulesNamespaceMap) {
    const namespaceMap = globalStore._modulesNamespaceMap;

    for (const namespace in namespaceMap) {
      if (namespaceMap.hasOwnProperty(namespace)) {
        // Remove trailing slash for store ID generation
        const namespaceKey = namespace.replace(/\/$/, '');
        const storeId = `legacy/${namespaceKey}`;

        try {
          storeDefinitions[namespace] = createVuexModulePiniaStore({
            id: storeId,
            namespace: namespace,
          });
        } catch (error) {
          console.warn(`[VuexBridge] registerAllVuexModulesAsPinia: Failed to create store for namespace '${namespace}':`, error);
        }
      }
    }
  } else {
    console.warn('[VuexBridge] registerAllVuexModulesAsPinia: Unable to access _modulesNamespaceMap. This function requires Vuex internals.');
  }

  return storeDefinitions;
}