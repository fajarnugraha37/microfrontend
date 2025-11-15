import _ from 'lodash';
import { globalStore } from './global';
import { createGlobalPiniaStoreFromVuex, createPiniaStoreFromVuex } from './bridges/create-from-vuex';

// -----------------------------------------------------------------------------
// Vuex and Pinia store setup helpers
// -----------------------------------------------------------------------------
/**
 * 
 * @param {import('vue').VueConstructor} vue 
 */
export const useVuexStore = window.useVuexStore = (vue) => {
  vue.use(new class VuexStorePlugin {
    install(Vue) {
      Vue.use(window.Vuex);
      /** @type {import('vuex').Store} */
      const store = new window.Vuex.Store(globalStore);

      // TODO: remove test code
      store.dispatch('schedularIncrement');

      // expose a consistent globalStore pointer for bridging convenience
      window.store = store;
      window.globalStore = store;
    }
  });
}

/**
 * @param {import('pinia')} pinia
 * @param {string} namespace - vuex module namespace
 * @param {object} [options] 
 */
export const useDerivedStore = window.useDerivedStore = (pinia, namespace, options = {}) => {
  return createPiniaStoreFromVuex(pinia, window.globalStore, namespace, options);
}

/**
 * @param {import('pinia')} pinia
 * @returns {function(import('vue').VueConstructor): void}
 */
export const usePiniaStore = window.usePiniaStore = (pinia) => new class PiniaStorePlugin {
  install(app, options) {
    const bridgeStore = createGlobalPiniaStoreFromVuex(pinia, window.globalStore);
    const derivedStore = {};

    const namespaces = Object.keys(store._modulesNamespaceMap)
      .map((ns) => ns.replace(/\/$/, ""));
      console.log('[Vuex] Found vuex modules for bridging:', namespaces); 
    for (const namespace of namespaces) {
      const opts = (options && options[namespace]) ?? {}; 
      const store = createPiniaStoreFromVuex(pinia, window.globalStore, namespace, opts);
      derivedStore[namespace] = store;
      app.provide(`$.derivedStore.${namespace}`, store);
      console.log(`[Vuex] Created Pinia bridge store for module: ${namespace}`);
    }

    app.config.globalProperties.$bridgeStore = window.bridgeStore = bridgeStore;
    app.config.globalProperties.$derivedStore = window.derivedStore = derivedStore;
    app.config.globalProperties.$parentStore = window.store;
    app.config.globalProperties.$globalStore = window.globalStore;
    app.provide('derivedStore', derivedStore);
    app.provide('bridgeStore', bridgeStore);
    app.provide('parentStore', window.store);
    app.provide('globalStore', window.globalStore);
  }
}