/// <reference path="../../global.d.ts" />
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
import Vuex from "vuex";

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
            if (!window.Vuex || !window.store || !window.globalStore) {
                window.Vuex = Vuex;
                /** @type {import('vuex').Store} */
                const store = new window.Vuex.Store(globalStore);

                // expose a consistent globalStore pointer for bridging convenience
                window.store = store;
                window.globalStore = store;
                console.debug('[PLUGIN][Vuex<->Pinia] Created Vuex global store');
            } else {
                console.debug('[PLUGIN][Vuex<->Pinia] Vuex already installed');
            }

            Vue.use(window.Vuex);
            if (callback) {
                callback(window.store);
            }
        }
    });
}

export const useDerivedStore = window.useDerivedStore = (pinia, piniaInstance, namespace, options = {}) => {
    return createPiniaStoreFromVuex(pinia, piniaInstance, window.globalStore, namespace, options);
}

export const usePiniaStore = window.usePiniaStore = (pinia, piniaInstance) => ({
    version: 'vue-3',
    type: 'pinia-3',
    name: 'Store-Pinia-3',

    /**
     * @param {any} app 
     * @param {{ [key: string]: Record<string, any> }} options 
     */
    install(app, options) {
        console.debug('[PLUGIN][Vuex<->Pinia] Installing Pinia store plugin bridge');
        // expose a consistent globalStore pointer for bridging convenience
        app.config.globalProperties.$store = window.store;
        app.config.globalProperties.$parentStore = window.store;
        app.config.globalProperties.$globalStore = window.globalStore;
        app.provide('store', window.store);
        app.provide('parentStore', window.store);
        app.provide('globalStore', window.globalStore);

        // create global Pinia bridge store
        if (!window.bridgeStore) {
            const bridgeStore = createGlobalPiniaStoreFromVuex(pinia, piniaInstance, window.globalStore);

            window.bridgeStore = bridgeStore;
            console.debug('[PLUGIN][Vuex<->Pinia] Created Pinia bridge store for Vuex root');
        } else {
            console.debug('[PLUGIN][Vuex<->Pinia] Pinia bridge store already installed');
        }
        app.config.globalProperties.$bridgeStore = window.bridgeStore;
        app.provide('bridgeStore', window.bridgeStore);

        // create derived Pinia stores for each Vuex module
        const namespaces = Object.keys(window.store._modulesNamespaceMap)
            .map((ns) => ns.replace(/\/$/, ""));
        if (namespaces.length > 0) {
            if (window.derivedStore && window.derivedStore.disposeBridge && typeof window.derivedStore.disposeBridge === 'function') {
                console.debug('[PLUGIN][Vuex<->Pinia] Disposing existing derivedStore bridges');
                window.derivedStore.disposeBridge();
            }

            /** @type {Record<string, import("pinia").Store<any, any>>} */
            const derivedStore = {};
            for (const namespace of namespaces) {
                console.log(`[PLUGIN][Vuex<->Pinia] Created Pinia bridge store for module: ${namespace}`)

                const opts = (options && options[namespace]) ?? {};
                const store = createPiniaStoreFromVuex(pinia, piniaInstance, window.globalStore, namespace, opts);
                derivedStore[namespace] = store;
                app.provide(`$.derivedStore.${namespace}`, store);;
            }

            derivedStore.disposeBridge = () => {
                for (const ns of Object.keys(derivedStore)) {
                    const store = derivedStore[ns]; 
                    if (store.disposeBridge) store.disposeBridge();
                }
            };

            window.derivedStore = derivedStore
            console.debug('[PLUGIN][Vuex<->Pinia] Created derived Pinia stores for Vuex modules:', Object.keys(derivedStore));
        } else {
            console.info('[PLUGIN][Vuex<->Pinia] No vuex modules found for bridging');
        }
        app.config.globalProperties.$derivedStore = window.derivedStore;
        app.provide('derivedStore', window.derivedStore);
    }
})