// @ts-check
import _ from "lodash";
import { Mutex } from "async-mutex";
import { deepPatch, getModuleState } from "../utils";

const mutex = new Mutex();

/**
 * 2-way sync between a vuex MODULE and a pinia store.
 *
 * vuex module must have mutation: BRIDGE_REPLACE_STATE(state, newState)
 *
 * @param {object} options
 * @param {import(".").VuexStore} options.vuex
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
        piniaStore.$patch((/** @type {{ [x: string]: any; }} */ s) => {
            Object.keys(s).forEach((k) => {
                // eslint-disable-next-line no-param-reassign
                delete s[k];
            });
            Object.assign(s, initialModuleState);
        });
    }

    // vuex -> pinia (module scope)
    const unSubVuex = vuex.subscribe((/** @type {{ type: string; }} */ mutation, /** @type {Record<string, any>} */ state) => mutex.runExclusive(() => {
        try {
            if (!mutation.type.startsWith(namespace + "/")) return;
            if (syncingFromPinia) return;

            const moduleState = getModuleState(state, namespace);
            if (!moduleState) return;

            syncingFromVuex = true;
            piniaStore.$patch((/** @type {Record<string, any>} */ s) => {
                // find what changed?
                // @ts-ignore
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
    const unSubPinia = piniaStore.$subscribe((mutation, state) => mutex.runExclusive(() => {
        try {
            if ('payload' in mutation) {
                if (mutation.payload === undefined || syncingFromVuex)
                    return;

                syncingFromPinia = true;
                console.debug(`[Pinia->Vuex] syncing ${namespace} state ${mutation.storeId}@${mutation.type}:`, mutation.payload);
                vuex.commit(`${namespace}/BRIDGE_REPLACE_STATE`, mutation.payload);
            } else {
                console.debug(`[Pinia->Vuex] skipping non-payload mutation ${mutation.storeId}@${mutation.type}`);
            }
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