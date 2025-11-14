import { getGlobalStore } from './vuexBridgeConfig';
import { createVuexModulePiniaStore } from './createVuexModulePiniaStore';

/**
 * Inspects the global Vuex store and registers Pinia stores for each namespaced module.
 * You can rely on Vuex internals like _modulesNamespaceMap if needed.
 *
 * @returns {Object<string, import('pinia').StoreDefinition>} map of [namespace]: storeDefinition
 */
export function registerAllVuexModulesAsPinia() {
  const store = getGlobalStore();
  if (!store) {
    console.warn('[VuexBridge] Cannot register Pinia stores. Vuex store is unavailable.');
    return {};
  }

  const piniaStores = {};

  for (const namespace in store._modulesNamespaceMap) {
    const namespaceWithoutSlash = namespace.replace(/\/$/, '');
    piniaStores[namespaceWithoutSlash] = createVuexModulePiniaStore({
      id: `legacy/${namespaceWithoutSlash}`,
      namespace,
    });
  }

  return piniaStores;
}