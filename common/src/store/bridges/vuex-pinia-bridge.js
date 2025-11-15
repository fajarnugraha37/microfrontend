// @ts-check
import _ from "lodash";
import { Mutex } from "async-mutex";
import { deepPatch } from "../../utils";
/**
 * @typedef {import('vuex').Store} VuexStore
 */

const mutex = new Mutex();

/**
 * get nested module state from vuex root state by namespace
 * @param {Record<string, any>} rootState
 * @param {string} namespace e.g. "user" or "account/profile"
 * @returns {any}
 */
export function getModuleState(rootState, namespace) {
    if (!namespace) return rootState;
    return namespace.split("/").reduce((s, key) => (s ? s[key] : undefined), rootState);
}

/**
 * 2-way sync between a vuex MODULE and a pinia store.
 *
 * vuex module must have mutation: BRIDGE_REPLACE_STATE(state, newState)
 *
 * @param {object} options
 * @param {VuexStore} options.vuex
 * @param {string} options.namespace - vuex module namespace, e.g. "user"
 * @param {import('pinia').Store} options.piniaStore
 * @returns {() => void} disposer
 */
export function createVuexModulePiniaBridge({ vuex, namespace, piniaStore }) {
    let syncingFromVuex = false;
    let syncingFromPinia = false;

    // initial sync vuex -> pinia
    const initialModuleState = getModuleState(vuex.state, namespace);
    if (!initialModuleState) {
        console.warn(`[bridge] vuex module "${namespace}" not found`);
    } else {
        piniaStore.$patch((s) => {
            Object.keys(s).forEach((k) => {
                // eslint-disable-next-line no-param-reassign
                delete s[k];
            });
            Object.assign(s, initialModuleState);
        });
    }

    // vuex -> pinia (module scope)
    const unSubVuex = vuex.subscribe((mutation, state) => mutex.runExclusive(() => {
        try {
            if (!mutation.type.startsWith(namespace + "/")) return;
            if (syncingFromPinia) return;

            const moduleState = getModuleState(state, namespace);
            if (!moduleState) return;

            syncingFromVuex = true;
            piniaStore.$patch((s) => {
                // find what changed?
                const diff = _.diff(s, state);
                if (Object.keys(diff).length === 0)
                    return;
                console.debug(`[Vuex->Pinia] syncing ${namespace} state diff:`, diff);
                deepPatch(s, diff);
            });
        } finally {
            syncingFromVuex = false;
        }
    }),
    {
        detached: true,
        deep: true,
        immediate: true,
    });

    // pinia -> vuex
    const unSubPinia = piniaStore.$subscribe(
        (mutation, state) => mutex.runExclusive(() => {
            try {
                if (mutation.payload === undefined || syncingFromVuex) return;

                syncingFromPinia = true;
                console.debug(`[Pinia->Vuex] syncing ${namespace} state ${mutation.storeId}@${mutation.type}:`, mutation.payload);
                vuex.commit(`${namespace}/BRIDGE_REPLACE_STATE`, mutation.payload);
            } finally {
                syncingFromPinia = false;
            }
        }),
        {
            detached: true,
            deep: true,
            immediate: true,
        }
    );
    return function disposeBridge() {
        // unSubVuex();
        unSubPinia();
    };
}

/**
 * 2-way sync between the vuex ROOT state and a pinia store.
 * root vuex must have mutation: BRIDGE_REPLACE_ROOT_STATE(state, newState)
 *
 * @param {object} options
 * @param {VuexStore} options.vuex
 * @param {import('pinia').Store} options.piniaStore
 * @returns {() => void} disposer
 */
export function createVuexRootPiniaBridge({ vuex, piniaStore }) {
    let syncingFromVuex = false;
    let syncingFromPinia = false;

    // initial vuex root -> pinia
    syncingFromVuex = true;
    piniaStore.$patch((s) => Object.assign(s, vuex.state));
    syncingFromVuex = false;

    // vuex root -> pinia partial patch
    
    const unSubVuex = vuex.subscribe((mutation, state) => mutex.runExclusive(() => {
        try {
            if (mutation.type === "BRIDGE_REPLACE_ROOT_STATE") return;
            if (syncingFromPinia) return;
            
            syncingFromVuex = true;
            piniaStore.$patch((s) => {
                // find what changed?
                const diff = _.diff(s, state);
                if (Object.keys(diff).length === 0)
                    return;
                console.debug('[Vuex->Pinia] syncing root state diff:', diff);
                deepPatch(s, diff);
            });
        } finally {
            syncingFromVuex = false;
        }
    }), 
    {
        detached: true,
        deep: true,
        immediate: true,
    });

    // pinia -> vuex root partial patch
    const unSubPinia = piniaStore.$subscribe(
        (mutation, state) => mutex.runExclusive(() => {
            try {
                if (mutation.payload === undefined || syncingFromVuex) return;

                syncingFromPinia = true;
                console.debug(`[Pinia->Vuex] syncing root state ${mutation.storeId}@${mutation.type}:`, mutation.payload);
                vuex.commit("BRIDGE_REPLACE_ROOT_STATE", mutation.payload);
            } finally {
                syncingFromPinia = false;
            }
        }),
        {
            detached: true,
            deep: true,
            immediate: true,
        }
    );

    return function disposeBridge() {
        unSubVuex();
        unSubPinia();
    };
}
