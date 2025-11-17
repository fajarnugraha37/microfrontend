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
export const useVuexStore = window.$__useVuexStore = (vue, globalStore, callback) => {
    vue.use(new class VuexStorePlugin {
        version = 'vue-2';
        type = 'vuex-3';
        name = 'Store-Vuex-3';

        /**
         * @param {import('vue').VueConstructor} Vue 
         */
        install(Vue) {
            if (!window.Vuex || !window.$__store) {
                window.Vuex = Vuex;
                /** @type {import('vuex').Store} */
                const store = new window.Vuex.Store(globalStore);

                // expose a consistent globalStore pointer for bridging convenience
                window.$__store = store;
                console.debug('[PLUGIN][Vuex<->Pinia] Created Vuex global store');
            } else {
                console.debug('[PLUGIN][Vuex<->Pinia] Vuex already installed');
            }

            Vue.use(window.Vuex);
            if (callback) {
                callback(window.$__store);
            }
        }
    });
}

export const useDerivedStore = window.$__useDerivedStore = (pinia, piniaInstance, namespace, options = {}) => {
    return createPiniaStoreFromVuex(pinia, piniaInstance, window.$__store, namespace, options);
}

export const usePiniaStore = window.$__usePiniaStore = (pinia, piniaInstance) => ({
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
        app.config.globalProperties.$store = window.$__store;  
        app.provide('store', window.$__store);

        // create global Pinia bridge store
        if (!piniaInstance.$__bridgeStore) {
            const $__bridgeStore = createGlobalPiniaStoreFromVuex(pinia, piniaInstance, window.$__store);

            piniaInstance.$__bridgeStore = $__bridgeStore;
            console.debug('[PLUGIN][Vuex<->Pinia] Created Pinia bridge store for Vuex root');
        } else {
            console.debug('[PLUGIN][Vuex<->Pinia] Pinia bridge store already installed');
        }
        app.config.globalProperties.$bridgeStore = piniaInstance.$__bridgeStore;
        app.provide('bridgeStore', piniaInstance.$__bridgeStore);

        // create derived Pinia stores for each Vuex module
        const namespaces = Object.keys(window.$__store._modulesNamespaceMap)
            .map((ns) => ns.replace(/\/$/, ""));
        if (namespaces.length > 0) {
            if (piniaInstance.$__derivedStore 
                && piniaInstance.$__derivedStore.disposeBridge 
                && typeof piniaInstance.$__derivedStore.disposeBridge === 'function') {
                console.debug('[PLUGIN][Vuex<->Pinia] Disposing existing derivedStore bridges');
                piniaInstance.$__derivedStore.disposeBridge();
            }

            /** @type {Record<string, import("pinia").Store<any, any>> & { disposeBridge: () => void }} */
            const derivedStore = {};
            for (const namespace of namespaces) {
                console.log(`[PLUGIN][Vuex<->Pinia] Created Pinia bridge store for module: derivedStore.${namespace}`)

                const opts = (options && options[namespace]) ?? {};
                const store = createPiniaStoreFromVuex(pinia, piniaInstance, window.$__store, namespace, opts);
                derivedStore[namespace] = store;
                app.provide(`derivedStore.${namespace}`, store);;
            }

            derivedStore.disposeBridge = () => {
                for (const ns of Object.keys(derivedStore)) {
                    const store = derivedStore[ns]; 
                    if (store.disposeBridge) store.disposeBridge();
                }
            };

            piniaInstance.$__derivedStore = derivedStore
            console.debug('[PLUGIN][Vuex<->Pinia] Created derived Pinia stores for Vuex modules:', Object.keys(derivedStore));
        } else {
            console.info('[PLUGIN][Vuex<->Pinia] No vuex modules found for bridging');
        }
        app.config.globalProperties.$derivedStore = piniaInstance.$__derivedStore;
        app.provide('derivedStore', piniaInstance.$__derivedStore);
    }
});

export const useTransferablePlugin = window.$__useTransferablePlugin = ({
    version: 'vue-3',
    type: 'vue-3',
    name: 'TransferablePlugin-Vue-3',

    /**
     * @param {any} app 
     * @param {{ [key: string]: Record<string, any> }} options 
     */
    install(app, options) {
        const includes = options && options.includes ? options.includes : [];
        const excludes = options && options.excludes ? options.excludes : [];
        (window.$__pluginRegistry || []).filter(item => {
            const plugin = item.plugin;
            if (includes.length > 0 || excludes.length > 0) {
                if (!includes.includes(plugin.name)) {
                    return false;
                }
                if (excludes.includes(plugin.name)) {
                    return false;
                }
            } else if (plugin.type !== 'global') {
                return false;
            }
            return true;
        })
            .forEach(pluginInstall => {
                console.log(`[TransferablePlugin] Installing plugin: ${pluginInstall.plugin.name}`);
                const plugin = pluginInstall.plugin;
                const args = plugin.args || [];
                app.use(plugin.install, ...args);
            });
    }
});