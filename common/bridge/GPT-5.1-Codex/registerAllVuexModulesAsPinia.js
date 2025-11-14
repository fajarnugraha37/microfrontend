import { createVuexModulePiniaStore } from './createVuexModulePiniaStore.js';
import { getGlobalStore } from './vuexBridgeConfig.js';

/**
 * @typedef {Object} VuexModuleDescriptor
 * @property {string[]} path Path segments under the root state (e.g. ["auth"] or ["exam", "results"]).
 * @property {string} namespace Normalized namespace (trailing slash) or empty string when the module is not namespaced.
 * @property {boolean} namespaced Indicates whether Vuex registered the module as namespaced.
 * @property {import('vuex').Module<any, any>} module Raw Vuex module reference (Vuex internal structure).
 */

/**
 * @typedef {Object} RegisterAllOptions
 * @property {(descriptor: VuexModuleDescriptor) => boolean} [filter] Return false to skip a module.
 * @property {(descriptor: VuexModuleDescriptor) => string} [idFactory] Custom Pinia id factory.
 * @property {string} [idPrefix='legacy'] Prefix used when `idFactory` is not provided.
 * @property {boolean} [includeRoot=true] Whether to register a root-level mirror store.
 * @property {string} [rootId] Pinia id for the root mirror store (defaults to `${idPrefix}/root`).
 * @property {(moduleState: any, rootState: any) => Record<string, any>} [mapState]
 * @property {(moduleGetters: Record<string, any>, namespace: string) => Record<string, any>} [mapGetters]
 */

/**
 * Introspect the Vuex store and register Pinia stores for every module.
 *
 * @param {RegisterAllOptions} [options]
 * @returns {Record<string, import('pinia').StoreDefinition>} Map of namespace/path → Pinia store definition.
 */
export function registerAllVuexModulesAsPinia(options = {}) {
  const vuexStore = getGlobalStore();
  if (!vuexStore) {
    console.warn('[vuex-pinia-bridge] registerAllVuexModulesAsPinia: global store is unavailable.');
    return {};
  }

  const descriptors = collectModuleDescriptors(vuexStore);
  const storeMap = {};
  const idPrefix = options.idPrefix || 'legacy';

  descriptors.forEach((descriptor) => {
    if (typeof options.filter === 'function' && options.filter(descriptor) === false) {
      return;
    }
    const piniaId = typeof options.idFactory === 'function'
      ? options.idFactory(descriptor)
      : buildDefaultId(idPrefix, descriptor);

    const key = descriptor.namespaced
      ? descriptor.namespace
      : descriptor.path.join('/') || '<root>';

    storeMap[key] = createVuexModulePiniaStore({
      id: piniaId,
      namespace: descriptor.namespace,
      statePath: descriptor.path,
      mapState: options.mapState,
      mapGetters: options.mapGetters,
    });
  });

  if (options.includeRoot !== false && !storeMap['<root>']) {
    storeMap['<root>'] = createVuexModulePiniaStore({
      id: options.rootId || `${idPrefix}/root`,
      namespace: '',
      statePath: [],
      mapState: options.mapState,
      mapGetters: options.mapGetters,
    });
  }

  return storeMap;
}

/**
 * @param {string} idPrefix
 * @param {VuexModuleDescriptor} descriptor
 */
function buildDefaultId(idPrefix, descriptor) {
  const base = descriptor.namespaced
    ? descriptor.namespace.replace(/\/+/g, '-').replace(/^-|-$/g, '')
    : descriptor.path.join('-');
  const sanitized = base || 'root';
  return `${idPrefix}/${sanitized}`;
}

/**
 * @param {import('vuex').Store<any>} store
 * @returns {VuexModuleDescriptor[]}
 */
function collectModuleDescriptors(store) {
  const result = [];
  const rootModule = store._modules && store._modules.root;
  if (!rootModule) {
    return result;
  }
  traverseModule(rootModule, [], result, store._modulesNamespaceMap || {});
  return result;
}

/**
 * @param {any} module
 * @param {string[]} path
 * @param {VuexModuleDescriptor[]} bucket
 * @param {Record<string, any>} namespaceMap
 */
function traverseModule(module, path, bucket, namespaceMap) {
  if (!module || !module._children) {
    return;
  }
  Object.keys(module._children).forEach((key) => {
    const child = module._children[key];
    const childPath = path.concat(key);
    const namespace = computeNamespace(childPath, child);
    const descriptor = {
      path: childPath,
      namespace,
      namespaced: Boolean(namespace),
      module: child._rawModule || child,
    };

    // Vuex generates namespace entries only for namespaced modules, so we ensure parity here.
    if (descriptor.namespaced && !namespaceMap[namespace]) {
      namespaceMap[namespace] = child;
    }

    bucket.push(descriptor);
    traverseModule(child, childPath, bucket, namespaceMap);
  });
}

/**
 * @param {string[]} path
 * @param {any} module
 */
function computeNamespace(path, module) {
  const isNamespaced = Boolean(module && (module.namespaced || (module._rawModule && module._rawModule.namespaced)));
  if (!isNamespaced) {
    return '';
  }
  return `${path.join('/')}/`;
}
