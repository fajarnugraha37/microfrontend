import { defineStore } from 'pinia';
import { getGlobalStore } from './vuexBridgeConfig';

/**
 * Create a Pinia store that proxies an existing Vuex module.
 *
 * @param {Object} options
 * @param {string} options.id - Pinia store id (e.g. 'legacy/auth').
 * @param {string} options.namespace - Vuex module namespace, including trailing slash (e.g. 'auth/' or 'exam/').
 * @param {(state: any) => any} [options.mapState] - Optional mapper to shape the module state into Pinia state.
 * @param {(getters: any) => any} [options.mapGetters] - Optional mapper for Vuex getters to Pinia getters.
 * @returns {import('pinia').StoreDefinition}
 */
export function createVuexModulePiniaStore({ id, namespace, mapState, mapGetters }) {
  const namespaceWithoutSlash = namespace.replace(/\/$/, '');

  return defineStore(id, {
    state: () => {
      const store = getGlobalStore();
      if (!store) return {};

      const vuexState = store.state[namespaceWithoutSlash] || {};
      return mapState ? mapState(vuexState) : { ...vuexState };
    },

    getters: mapGetters
      ? mapGetters(getGlobalStore()?.getters || {})
      : {},

    actions: {
      /**
       * Commit a mutation to the Vuex store.
       * @param {string} type - Mutation type.
       * @param {any} payload - Mutation payload.
       */
      commitLocal(type, payload) {
        const store = getGlobalStore();
        if (store) {
          store.commit(namespace + type, payload);
        } else {
          console.warn(`[VuexBridge] Cannot commit mutation: ${type}. Vuex store is unavailable.`);
        }
      },

      /**
       * Dispatch an action to the Vuex store.
       * @param {string} type - Action type.
       * @param {any} payload - Action payload.
       */
      dispatchLocal(type, payload) {
        const store = getGlobalStore();
        if (store) {
          return store.dispatch(namespace + type, payload);
        } else {
          console.warn(`[VuexBridge] Cannot dispatch action: ${type}. Vuex store is unavailable.`);
        }
      },
    },

    /**
     * Subscribe to Vuex store mutations and keep Pinia state in sync.
     */
    onStoreInit() {
      const store = getGlobalStore();
      if (!store) return;

      store.subscribe((mutation, state) => {
        if (mutation.type.startsWith(namespace)) {
          const vuexState = state[namespaceWithoutSlash] || {};
          this.$patch(mapState ? mapState(vuexState) : { ...vuexState });
        }
      });
    },
  });
}