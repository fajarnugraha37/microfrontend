// @ts-check
import _ from "lodash";
import { Mutex } from "async-mutex";
import { deepPatch } from "../utils";
/**
 * @typedef {import('vuex').Store} VuexStore
 */

const mutex = new Mutex();

/**
 * 2-way sync between the vuex ROOT state and a pinia store.
 * root vuex must have mutation: BRIDGE_REPLACE_ROOT_STATE(state, newState)
 *
 * @param {object} options
 * @param {VuexStore & { state: Record<string, Function[]> }} options.vuex
 * @param {import('pinia').Store} options.piniaStore
 * @returns {() => void} disposer
 */
export function createVuexRootPiniaBridge({ vuex, piniaStore }) {
    let syncingFromVuex = false;
    let syncingFromPinia = false;

    // initial vuex root -> pinia
    syncingFromVuex = true;
    piniaStore.$patch((/** @type {Record<string, any>} */ s) => Object.assign(s, vuex.state));
    syncingFromVuex = false;

    // vuex root -> pinia partial patch
    const unSubVuex = vuex.subscribe((
        /** @type {{ type: string; }} */ mutation, /** @type {Record<string, any>} */ state) => mutex.runExclusive(() => {
            try {
                if (mutation.type === "BRIDGE_REPLACE_ROOT_STATE") return;
                if (syncingFromPinia) return;

                syncingFromVuex = true;
                piniaStore.$patch((/** @type {Record<string, any>} */ s) => {
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
        }
    );

    // pinia -> vuex root partial patch
    const unSubPinia = piniaStore.$subscribe(
        (mutation, state) => mutex.runExclusive(() => {
            try {
                if ('payload' in mutation) {
                    if (mutation.payload === undefined || syncingFromVuex) return;

                    syncingFromPinia = true;
                    console.debug(`[Pinia->Vuex] syncing root state ${mutation.storeId}@${mutation.type}:`, mutation.payload);
                    vuex.commit("BRIDGE_REPLACE_ROOT_STATE", mutation.payload);
                } else {
                    console.debug('[Pinia->Vuex] skipping mutation without payload:', mutation);
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
