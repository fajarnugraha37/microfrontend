/**
 * @file registerAllVuexModulesAsPinia.js
 * Auto-register Pinia stores for all Vuex modules by introspecting the global store.
 * Uses Vuex internals (_modulesNamespaceMap) for pragmatic reasons.
 */
import { createVuexModulePiniaStore } from './createVuexModulePiniaStore.js'
import { getGlobalStore } from './vuexBridgeConfig.js'

/**
 * Inspects the global Vuex store and registers Pinia stores for each namespaced module.
 * Uses Vuex internals (_modulesNamespaceMap).
 * Tradeoff: Coupling to Vuex private API, but enables full module coverage.
 * @returns {Object<string, import('pinia').StoreDefinition>} map of [namespace]: storeDefinition
 */
export function registerAllVuexModulesAsPinia() {
  const store = getGlobalStore()
  if (!store || !store._modulesNamespaceMap) {
    console.warn('[VuexBridge] registerAllVuexModulesAsPinia: No _modulesNamespaceMap found')
    return {}
  }
  const result = {}
  for (const ns in store._modulesNamespaceMap) {
    // ns: e.g. 'auth/'
    result[ns] = createVuexModulePiniaStore({
      id: 'legacy/' + ns.replace(/\/$/, ''),
      namespace: ns
    })
  }
  return result
}
