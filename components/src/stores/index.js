// @ts-check
export * from "./createGlobalPiniaStoreFromVuex";
export * from "./createPiniaStoreFromVuex";
export * from "./createVuexModulePiniaBridge";
export * from "./createVuexRootPiniaBridge";
export * from "./bridges";

/**
 * @typedef {import('vuex').Store  & { state: Record<string, Function[]> }} VuexStore
 */

import _ from 'lodash';
import { createPiniaStoreFromVuex } from "./createPiniaStoreFromVuex";
import { createGlobalPiniaStoreFromVuex } from "./createGlobalPiniaStoreFromVuex";

// -----------------------------------------------------------------------------
// Vuex and Pinia store setup helpers
// -----------------------------------------------------------------------------
export const useVuexStore = window.useVuexStore = (vue, globalStore, callback) => {
    vue.use(new class VuexStorePlugin {
        /**
         * @param {import('vue').VueConstructor} Vue 
         */
        install(Vue) {
            Vue.use(window.Vuex);
            /** @type {import('vuex').Store} */
            const store = new window.Vuex.Store(globalStore);

            if (callback) {
                callback(store);
            }

            // expose a consistent globalStore pointer for bridging convenience
            window.store = store;
            window.globalStore = store;
        }
    });
}

export const useDerivedStore = window.useDerivedStore = (pinia, namespace, options = {}) => {
    return createPiniaStoreFromVuex(pinia, window.globalStore, namespace, options);
}

/**
 * Create a Vue 3 plugin that mirrors Vuex into Pinia and sets up derived stores.
 * @param {import('pinia')} pinia
 * @param {{ enableCrossTabSync?: boolean, crossTabChannelName?: string, crossTabThrottleMs?: number, enableLocalStorageFallback?: boolean }} [pluginOptions]
 */
export const usePiniaStore = window.usePiniaStore = (pinia, pluginOptions = {}) => (new class PiniaStorePlugin {
    /**
     * @param {any} app 
     * @param {{ [key: string]: Record<string, any> }} options 
     */
    install(app, options = {}) {
        // bridge factory will be created below with plugin options
        const bridgeOpts = Object.assign({}, pluginOptions || {}, options && options.bridge ? options.bridge : {});
        const bridgeStore = createGlobalPiniaStoreFromVuex(pinia, window.globalStore, bridgeOpts);

        /** @type {Record<string, import("pinia").Store<any, any>>} */
        const derivedStore = {};
        const namespaces = Object.keys(window.store._modulesNamespaceMap)
            .map((ns) => ns.replace(/\/$/, ""));
        console.log('[Vuex] Found vuex modules for bridging:', namespaces);
        for (const namespace of namespaces) {
            const opts = (options && options[namespace]) ?? {};
            // merge plugin-level options for cross-tab into a store-level options
            const storeOpts = Object.assign({}, opts, {
                enableCrossTabSync: (pluginOptions && pluginOptions.enableCrossTabSync) !== false,
                crossTabChannelName: pluginOptions && pluginOptions.crossTabChannelName,
                crossTabThrottleMs: pluginOptions && pluginOptions.crossTabThrottleMs,
                enableLocalStorageFallback: pluginOptions && pluginOptions.enableLocalStorageFallback,
            });
            const store = createPiniaStoreFromVuex(pinia, window.globalStore, namespace, storeOpts);
            derivedStore[namespace] = store;
            app.provide(`$.derivedStore.${namespace}`, store);
            console.log(`[Vuex] Created Pinia bridge store for module: ${namespace}`);
        }

        app.config.globalProperties.$parentStore = window.store;
        app.config.globalProperties.$globalStore = window.globalStore;
        // create bridgeStore options merged with plugin-level defaults
        app.config.globalProperties.$bridgeStore = window.bridgeStore = bridgeStore;
        app.config.globalProperties.$derivedStore = window.derivedStore = derivedStore;
        app.provide('parentStore', window.store);
        app.provide('globalStore', window.globalStore);
        app.provide('derivedStore', derivedStore);
        app.provide('bridgeStore', bridgeStore);
    }
})