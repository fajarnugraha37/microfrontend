import { defineStore } from 'pinia';
import { getGlobalStore } from './vuexBridgeConfig.js';

/**
 * Create a Pinia store that proxies an existing Vuex module.
 * This allows Vue 3 + Pinia microfrontends to interact with the global Vuex 3 store
 * from the shell app, maintaining state synchronization through subscriptions.
 *
 * @param {Object} options - Configuration options for the store
 * @param {string} options.id - Pinia store id (e.g. 'legacy/auth')
 * @param {string} options.namespace - Vuex module namespace, including trailing slash (e.g. 'auth/' or 'exam/')
 * @param {(state: any) => any} [options.mapState] - Optional mapper to shape the module state into Pinia state
 * @param {(getters: any) => any} [options.mapGetters] - Optional mapper for Vuex getters to Pinia getters
 * @returns {import('pinia').StoreDefinition} Pinia store definition that proxies the Vuex module
 */
export function createVuexModulePiniaStore(options) {
  const { id, namespace, mapState, mapGetters } = options;

  if (!id || typeof id !== 'string') {
    throw new Error('[VuexBridge] createVuexModulePiniaStore: id is required and must be a string');
  }

  if (!namespace || typeof namespace !== 'string') {
    throw new Error('[VuexBridge] createVuexModulePiniaStore: namespace is required and must be a string');
  }

  // Remove trailing slash for state access, but keep for getters/mutations/actions
  const namespaceWithoutSlash = namespace.replace(/\/$/, '');
  const namespaceWithSlash = namespace.endsWith('/') ? namespace : namespace + '/';

  const storeDefinition = defineStore(id, {
    state: () => {
      const globalStore = getGlobalStore();
      if (!globalStore) {
        console.warn(`[VuexBridge] createVuexModulePiniaStore(${id}): No global store available`);
        return {};
      }

      const moduleState = globalStore.state[namespaceWithoutSlash];
      if (moduleState === undefined) {
        console.warn(`[VuexBridge] createVuexModulePiniaStore(${id}): Module '${namespaceWithoutSlash}' not found in global store`);
        return {};
      }

      return mapState ? mapState(moduleState) : { ...moduleState };
    },

    getters: {
      ...(mapGetters ? mapGetters((getterName) => {
        const globalStore = getGlobalStore();
        if (!globalStore) return undefined;
        return globalStore.getters[namespaceWithSlash + getterName];
      }) : {}),
    },

    actions: {
      /**
       * Commit a mutation to the proxied Vuex module.
       * @param {string} type - Mutation type (without namespace prefix)
       * @param {*} payload - Mutation payload
       */
      commitLocal(type, payload) {
        const globalStore = getGlobalStore();
        if (!globalStore) {
          console.warn(`[VuexBridge] commitLocal(${type}): No global store available`);
          return;
        }
        globalStore.commit(namespaceWithSlash + type, payload);
        // After committing, sync the Pinia state
        this.$syncWithVuex();
      },

      /**
       * Dispatch an action to the proxied Vuex module.
       * @param {string} type - Action type (without namespace prefix)
       * @param {*} payload - Action payload
       * @returns {Promise<any>} Action result
       */
      async dispatchLocal(type, payload) {
        const globalStore = getGlobalStore();
        if (!globalStore) {
          console.warn(`[VuexBridge] dispatchLocal(${type}): No global store available`);
          return;
        }
        const result = await globalStore.dispatch(namespaceWithSlash + type, payload);
        // After dispatching, sync the Pinia state
        this.$syncWithVuex();
        return result;
      },

      /**
       * Manually sync the Pinia state with the current Vuex module state.
       * Call this if you suspect the states are out of sync.
       */
      $syncWithVuex() {
        const globalStore = getGlobalStore();
        if (!globalStore) return;

        const moduleState = globalStore.state[namespaceWithoutSlash];
        if (moduleState !== undefined) {
          const newState = mapState ? mapState(moduleState) : { ...moduleState };
          Object.assign(this.$state, newState);
        }
      },

      /**
       * Initialize the store with Vuex subscription for automatic sync.
       * This should be called once when the store is first used.
       */
      $initSync() {
        if (this._vuexUnsubscribe) return; // Already initialized

        const globalStore = getGlobalStore();
        if (!globalStore) {
          console.warn(`[VuexBridge] $initSync(${id}): No global store available for subscription`);
          return;
        }

        this._vuexUnsubscribe = globalStore.subscribe((mutation, state) => {
          // Only update if the mutation affects our namespace
          if (mutation.type.startsWith(namespaceWithSlash)) {
            this.$syncWithVuex();
          }
        });
      },
    },
  });

  // Return a wrapper that ensures sync is initialized
  return (options) => {
    const store = storeDefinition(options);
    store.$initSync();
    return store;
  };
}