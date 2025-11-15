import { createVuexModulePiniaStore } from './createVuexModulePiniaStore'
import { getGlobalStore } from './vuexBridgeConfig'

/**
 * Inspects the global Vuex store and creates Pinia stores for each namespaced Vuex module.
 * Note: this relies on Vuex internals such as _modulesNamespaceMap.
 *
 * @param {import('pinia').defineStore} defineStore
 * @param {import('vue').reactive} reactive
 * @param {import('vue').toRefs} toRefs
 * @param {import('vue').computed} computed
 * @returns {Object<string, function(): import('pinia').StoreDefinition>} map of [namespace]: storeFactory
 */
export function registerAllVuexModulesAsPinia(defineStore, reactive, toRefs, computed) {
  const globalStore = getGlobalStore()
  if (!globalStore) {
    // eslint-disable-next-line no-console
    console.warn('[registerAllVuexModulesAsPinia] Global store not found; no stores were created.')
    return {}
  }

  const map = {}

  // Vuex 3 internal map is _modulesNamespaceMap; it maps keys like 'auth/' to module instances
  const namespaceMap = (globalStore && globalStore._modules && globalStore._modulesNamespaceMap) || globalStore._modulesNamespaceMap

  if (!namespaceMap) {
    // If not found, fallback to scanning keys from store.state directly (top-level only)
    // eslint-disable-next-line no-console
    console.warn('[registerAllVuexModulesAsPinia] _modulesNamespaceMap not found; falling back to shallow state keys.')
    const stateKeys = Object.keys(globalStore.state || {})
    stateKeys.forEach((k) => {
      const ns = `${k}/`
      map[ns] = createVuexModulePiniaStore({ id: `legacy/${k}`, namespace: ns }, defineStore, reactive, toRefs, computed)
    })
    return map
  }

  Object.keys(namespaceMap).forEach((ns) => {
    // ns should be something like 'auth/' or 'profile/submodule/'
    // create a Pinia store factory with id derived from namespace
    const sanitizedId = `legacy/${ns.replace(/\/+$/,'').replace(/\//g, '-')}`
    map[ns] = createVuexModulePiniaStore({ id: sanitizedId, namespace: ns }, defineStore, reactive, toRefs, computed)
  })

  // also expose the root state as '<root>' facade
  map['<root>'] = createVuexModulePiniaStore({ id: 'legacy/root', namespace: '<root>' }, defineStore, reactive, toRefs, computed)

  return map
}
