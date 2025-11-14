import { defineStore } from 'pinia';
import { getGlobalStore } from './vuexBridgeConfig.js';

const subscriptionRegistry = new WeakMap();
const missingNamespaceWarnings = new Set();

/**
 * @typedef {Object} CreateVuexModulePiniaStoreOptions
 * @property {string} id Pinia store id (e.g. "legacy/auth").
 * @property {string} [namespace] Vuex namespace including trailing slash (e.g. "auth/"). Empty string targets the root store.
 * @property {string | string[]} [statePath] Optional explicit state path (relative to root) used when the Vuex module is not namespaced. Example: "legacy/profile" or ["legacy", "profile"].
 * @property {(moduleState: any, rootState: any) => Record<string, any>} [mapState] Optional mapper that shapes the Vuex module state into the Pinia state tree.
 * @property {(moduleGetters: Record<string, any>, namespace: string) => Record<string, any>} [mapGetters] Optional mapper that shapes Vuex getters into Pinia getters.
 */

/**
 * Create a Pinia store definition that proxies a Vuex module.
 *
 * @param {CreateVuexModulePiniaStoreOptions} options
 * @returns {import('pinia').StoreDefinition}
 */
export function createVuexModulePiniaStore(options) {
  const normalized = normalizeOptions(options);

  const baseUseStore = defineStore(normalized.id, {
    state: () => getInitialStateSnapshot(normalized),
    getters: buildPiniaGetters(normalized),
    actions: {
      /**
       * Force a manual sync from Vuex into this Pinia instance.
       */
      refreshFromVuex() {
        const snapshot = getMappedStateSnapshot(normalized);
        applyStateToPinia(this, snapshot);
      },

      /**
       * Commit a mutation on the underlying Vuex module.
       *
       * @param {string} type Local mutation type (without namespace).
       * @param {any} payload Payload forwarded to Vuex commit.
       * @param {any} [commitOptions] Optional Vuex commit options.
       */
      commitLocal(type, payload, commitOptions) {
        const vuexStore = getGlobalStore();
        if (!vuexStore) {
          console.warn(
            `[vuex-pinia-bridge] Cannot commit "${type}" because the global store is unavailable.`
          );
          return;
        }
        const targetType = qualifyType(type, normalized.namespaceWithSlash);
        return vuexStore.commit(targetType, payload, commitOptions);
      },

      /**
       * Dispatch an action on the underlying Vuex module.
       *
       * @param {string} type Local action type (without namespace).
       * @param {any} payload Payload forwarded to Vuex dispatch.
       * @returns {Promise<any>}
       */
      dispatchLocal(type, payload) {
        const vuexStore = getGlobalStore();
        if (!vuexStore) {
          console.warn(
            `[vuex-pinia-bridge] Cannot dispatch "${type}" because the global store is unavailable.`
          );
          return Promise.resolve(null);
        }
        const targetType = qualifyType(type, normalized.namespaceWithSlash);
        return vuexStore.dispatch(targetType, payload);
      },
    },
  });

  const wrappedUseStore = function wrappedVuexProxyStore(pinia) {
    const store = baseUseStore(pinia);
    ensureSubscription(store, normalized);
    return store;
  };

  copyStaticProps(baseUseStore, wrappedUseStore);

  return wrappedUseStore;
}

/**
 * @param {CreateVuexModulePiniaStoreOptions} options
 */
function normalizeOptions(options) {
  if (!options || !options.id) {
    throw new Error('[vuex-pinia-bridge] createVuexModulePiniaStore requires an "id".');
  }
  const namespaceRaw = typeof options.namespace === 'string' ? options.namespace : '';
  const namespaceWithSlash = normalizeNamespace(namespaceRaw);
  const statePathSegments = resolveStatePath(options.statePath, namespaceWithSlash);
  return {
    ...options,
    namespaceWithSlash,
    statePathSegments,
    namespaceKey: namespaceWithSlash || '<root>',
    statePathLabel: statePathSegments.length ? statePathSegments.join('/') : '<root>',
  };
}

/**
 * @param {string} namespace
 */
function normalizeNamespace(namespace) {
  if (!namespace) {
    return '';
  }
  return namespace.endsWith('/') ? namespace : `${namespace}/`;
}

/**
 * Resolve the path segments used to read module state from the root Vuex state.
 *
 * @param {string | string[] | undefined} userStatePath
 * @param {string} namespaceWithSlash
 * @returns {string[]}
 */
function resolveStatePath(userStatePath, namespaceWithSlash) {
  if (Array.isArray(userStatePath)) {
    return userStatePath.filter(Boolean);
  }
  if (typeof userStatePath === 'string' && userStatePath.trim().length) {
    return userStatePath
      .split('/')
      .map((segment) => segment.trim())
      .filter(Boolean);
  }
  if (namespaceWithSlash) {
    return namespaceWithSlash.slice(0, -1).split('/').filter(Boolean);
  }
  return [];
}

/**
 * @param {ReturnType<typeof normalizeOptions>} normalized
 */
function getInitialStateSnapshot(normalized) {
  const snapshot = getMappedStateSnapshot(normalized);
  return snapshot;
}

/**
 * @param {ReturnType<typeof normalizeOptions>} normalized
 */
function getMappedStateSnapshot(normalized) {
  const vuexStore = getGlobalStore();
  if (!vuexStore || typeof vuexStore.state === 'undefined') {
    return {};
  }

  const moduleState = extractModuleState(vuexStore.state, normalized.statePathSegments);

  if (typeof moduleState === 'undefined') {
    warnMissingNamespace(normalized);
    return {};
  }

  const mapper = typeof normalized.mapState === 'function' ? normalized.mapState : null;
  const mapped = mapper ? mapper(moduleState, vuexStore.state) : moduleState;

  return coerceToPlainObject(mapped, normalized.namespaceKey);
}

/**
 * @param {ReturnType<typeof normalizeOptions>} normalized
 */
function buildPiniaGetters(normalized) {
  if (typeof normalized.mapGetters === 'function') {
    return buildMappedGetters(normalized);
  }
  return {
    legacyGetters() {
      return getVuexGetterSnapshot(normalized);
    },
  };
}

/**
 * @param {ReturnType<typeof normalizeOptions>} normalized
 */
function buildMappedGetters(normalized) {
  const keys = getMapperKeys(normalized);
  if (!keys.length) {
    return {
      legacyMappedGetters() {
        return runGetterMapper(normalized) || {};
      },
    };
  }
  return keys.reduce((acc, key) => {
    acc[key] = function mappedPiniaGetter() {
      const mapped = runGetterMapper(normalized) || {};
      return mapped[key];
    };
    return acc;
  }, {});
}

/**
 * @param {ReturnType<typeof normalizeOptions>} normalized
 */
function runGetterMapper(normalized) {
  const snapshot = getVuexGetterSnapshot(normalized);
  if (typeof normalized.mapGetters !== 'function') {
    return snapshot;
  }
  try {
    const mapped = normalized.mapGetters(snapshot, normalized.namespaceWithSlash);
    if (!mapped || typeof mapped !== 'object') {
      return {};
    }
    return mapped;
  } catch (error) {
    console.warn(
      `[vuex-pinia-bridge] mapGetters for namespace "${normalized.namespaceKey}" threw:`,
      error
    );
    return {};
  }
}

/**
 * @param {ReturnType<typeof normalizeOptions>} normalized
 */
function getMapperKeys(normalized) {
  if (typeof normalized.mapGetters !== 'function') {
    return [];
  }
  try {
    const preview = normalized.mapGetters({}, normalized.namespaceWithSlash);
    if (preview && typeof preview === 'object') {
      return Object.keys(preview);
    }
  } catch (error) {
    console.warn(
      `[vuex-pinia-bridge] mapGetters key discovery for namespace "${normalized.namespaceKey}" threw:`,
      error
    );
  }
  return [];
}

/**
 * @param {ReturnType<typeof normalizeOptions>} normalized
 */
function getVuexGetterSnapshot(normalized) {
  const vuexStore = getGlobalStore();
  if (!vuexStore || !vuexStore.getters) {
    return {};
  }
  const prefix = normalized.namespaceWithSlash;
  const entries = Object.keys(vuexStore.getters);
  const snapshot = {};
  entries.forEach((type) => {
    if (!prefix) {
      snapshot[type] = vuexStore.getters[type];
      return;
    }
    if (type.startsWith(prefix)) {
      const localKey = type.slice(prefix.length);
      snapshot[localKey] = vuexStore.getters[type];
    }
  });
  return snapshot;
}

/**
 * @param {import('pinia').Store} piniaStore
 * @param {ReturnType<typeof normalizeOptions>} normalized
 */
function ensureSubscription(piniaStore, normalized) {
  if (subscriptionRegistry.has(piniaStore)) {
    return;
  }
  const vuexStore = getGlobalStore();
  if (!vuexStore || typeof vuexStore.subscribe !== 'function') {
    console.warn(
      `[vuex-pinia-bridge] Cannot subscribe to Vuex store for namespace "${normalized.namespaceKey}".`
    );
    return;
  }

  const syncState = () => {
    const snapshot = getMappedStateSnapshot(normalized);
    applyStateToPinia(piniaStore, snapshot);
  };

  syncState();

  const unsubscribe = vuexStore.subscribe((mutation) => {
    if (shouldSyncMutation(mutation.type, normalized.namespaceWithSlash)) {
      syncState();
    }
  });

  subscriptionRegistry.set(piniaStore, unsubscribe);

  const originalDispose = piniaStore.$dispose;
  piniaStore.$dispose = function bridgedDispose() {
    if (typeof unsubscribe === 'function') {
      unsubscribe();
    }
    subscriptionRegistry.delete(piniaStore);
    if (typeof originalDispose === 'function') {
      originalDispose.apply(this, arguments);
    }
  };
}

/**
 * @param {string} type
 * @param {string} namespaceWithSlash
 */
function qualifyType(type, namespaceWithSlash) {
  const trimmed = typeof type === 'string' ? type.trim() : '';
  if (!namespaceWithSlash) {
    return trimmed;
  }
  if (trimmed.startsWith(namespaceWithSlash)) {
    return trimmed;
  }
  return `${namespaceWithSlash}${trimmed}`;
}

/**
 * @param {string} mutationType
 * @param {string} namespaceWithSlash
 */
function shouldSyncMutation(mutationType, namespaceWithSlash) {
  if (!namespaceWithSlash) {
    return true;
  }
  if (!mutationType || typeof mutationType !== 'string') {
    return false;
  }
  return mutationType.startsWith(namespaceWithSlash);
}

/**
 * @param {Record<string, any>} stateTree
 * @param {string[]} namespaceSegments
 */
function extractModuleState(stateTree, namespaceSegments) {
  if (!namespaceSegments.length) {
    return stateTree;
  }
  let current = stateTree;
  for (let index = 0; index < namespaceSegments.length; index += 1) {
    const key = namespaceSegments[index];
    if (!current || typeof current !== 'object' || !(key in current)) {
      return undefined;
    }
    current = current[key];
  }
  return current;
}

/**
 * @param {any} value
 * @param {string} namespaceKey
 */
function coerceToPlainObject(value, namespaceKey) {
  if (value === null || typeof value === 'undefined') {
    return {};
  }
  if (isPlainObject(value)) {
    return cloneDeep(value);
  }
  if (Array.isArray(value)) {
    console.warn(
      `[vuex-pinia-bridge] State mapper for namespace "${namespaceKey}" returned an array. Wrapping it under { items }.`
    );
    return { items: cloneDeep(value) };
  }
  if (typeof value === 'object') {
    return cloneDeep(value);
  }
  console.warn(
    `[vuex-pinia-bridge] State mapper for namespace "${namespaceKey}" should return a plain object. Wrapping the primitive value.`
  );
  return { value };
}

/**
 * @param {import('pinia').Store} piniaStore
 * @param {Record<string, any>} snapshot
 */
function applyStateToPinia(piniaStore, snapshot) {
  piniaStore.$patch((state) => {
    Object.keys(state).forEach((key) => {
      if (!Object.prototype.hasOwnProperty.call(snapshot, key)) {
        delete state[key];
      }
    });
    Object.keys(snapshot).forEach((key) => {
      state[key] = snapshot[key];
    });
  });
}

/**
 * @param {ReturnType<typeof normalizeOptions>} normalized
 */
function warnMissingNamespace(normalized) {
  if (missingNamespaceWarnings.has(normalized.namespaceKey)) {
    return;
  }
  console.warn(
    `[vuex-pinia-bridge] Namespace "${normalized.namespaceKey}" with state path "${normalized.statePathLabel}" was not found in the Vuex state tree.`
  );
  missingNamespaceWarnings.add(normalized.namespaceKey);
}

/**
 * @param {Function} source
 * @param {Function} target
 */
function copyStaticProps(source, target) {
  Object.keys(source).forEach((key) => {
    if (typeof target[key] === 'undefined') {
      target[key] = source[key];
    }
  });
}

/**
 * @param {any} value
 */
function cloneDeep(value) {
  if (Array.isArray(value)) {
    return value.map((item) => cloneDeep(item));
  }
  if (!isPlainObject(value)) {
    return value;
  }
  return Object.keys(value).reduce((acc, key) => {
    acc[key] = cloneDeep(value[key]);
    return acc;
  }, {});
}

/**
 * @param {any} value
 */
function isPlainObject(value) {
  if (Object.prototype.toString.call(value) !== '[object Object]') {
    return false;
  }
  const proto = Object.getPrototypeOf(value);
  return proto === null || proto === Object.prototype;
}
