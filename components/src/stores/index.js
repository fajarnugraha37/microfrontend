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
        version = 'vue-2';
        type = 'vuex-3';
        name = 'Store-Vuex-3';

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

export const usePiniaStore = window.usePiniaStore = (pinia) => (new class PiniaStorePlugin {
    version = 'vue-3';
    type = 'pinia-3';
    name = 'Store-Pinia-3';

    /**
     * @param {any} app 
     * @param {{ [key: string]: Record<string, any> }} options 
     */
    install(app, options) {
        const bridgeStore = createGlobalPiniaStoreFromVuex(pinia, window.globalStore);
        /** @type {Record<string, import("pinia").Store<any, any>>} */
        const derivedStore = {};

        const namespaces = Object.keys(window.store._modulesNamespaceMap)
            .map((ns) => ns.replace(/\/$/, ""));
        console.log('[Vuex] Found vuex modules for bridging:', namespaces);
        for (const namespace of namespaces) {
            const opts = (options && options[namespace]) ?? {};
            const store = createPiniaStoreFromVuex(pinia, window.globalStore, namespace, opts);
            derivedStore[namespace] = store;
            app.provide(`$.derivedStore.${namespace}`, store);
            console.log(`[Vuex] Created Pinia bridge store for module: ${namespace}`);
        }

        app.config.globalProperties.$store = window.store;
        app.config.globalProperties.$parentStore = window.store;
        app.config.globalProperties.$globalStore = window.globalStore;
        app.config.globalProperties.$bridgeStore = window.bridgeStore = bridgeStore;
        app.config.globalProperties.$derivedStore = window.derivedStore = derivedStore;
        app.provide('store', window.store);
        app.provide('parentStore', window.store);
        app.provide('globalStore', window.globalStore);
        app.provide('derivedStore', derivedStore);
        app.provide('bridgeStore', bridgeStore);
    }
})