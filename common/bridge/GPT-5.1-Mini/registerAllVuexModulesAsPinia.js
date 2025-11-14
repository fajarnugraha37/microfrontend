import { getGlobalStore } from './vuexBridgeConfig'
import { createVuexModulePiniaStore } from './createVuexModulePiniaStore'

/**
 * Inspect the global Vuex store and create Pinia store factories for each namespaced module.
 * This uses Vuex internals (`_modulesNamespaceMap`) which are not part of the public API,
 * but are pragmatic for a migration bridge.
 *
 * @returns {Object<string, Function>} map of namespace -> useStore function
 */
export function registerAllVuexModulesAsPinia() {
  const gs = getGlobalStore()
  if (!gs) {
    console.warn('[vuex-bridge] registerAllVuexModulesAsPinia: no global store')
    return {}
  }

  const result = {}

  // Vuex internals: _modulesNamespaceMap maps "ns/" to module
  const nsMap = gs._modulesNamespaceMap || {}

  Object.keys(nsMap).forEach((ns) => {
    // Only consider namespaced modules ending with '/'
    const normalized = ns.replace(/\/$/, '')
    const piniaId = `legacy/${normalized}`
    try {
      result[ns] = createVuexModulePiniaStore({ id: piniaId, namespace: ns })
    } catch (err) {
      console.warn(`[vuex-bridge] Failed to create Pinia store for namespace '${ns}':`, err)
    }
  })

  return result
}

/**
 * Tradeoffs:
 * - Pros: quick automatic registration for many modules during migration.
 * - Cons: relies on non-public Vuex internals; module map shape could change between versions.
 *   Use carefully and prefer explicit per-module creation when possible.
 */
