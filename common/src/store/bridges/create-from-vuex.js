// @ts-check
import {
    getModuleState,
    createVuexModulePiniaBridge,
    createVuexRootPiniaBridge,
} from "./vuex-pinia-bridge";

/**
 * @typedef {import('vuex').Store} VuexStore
 */

/**
 * Create a **per-module Pinia store** from a vuex module.
 *
 * usage:
 *   const useUserStore = createPiniaStoreFromVuex(vuexStore, 'user')
 *   const userStore = useUserStore()
 *
 * it will:
 *   - derive initial state from the vuex module
 *   - create pinia store with that state
 *   - lazily create vuex <-> pinia 2-way bridge on first use
 *
 * vuex module must have mutation BRIDGE_REPLACE_STATE.
 *
 * @param {import('pinia')} pinia
 * @param {VuexStore} vuex
 * @param {string} namespace - vuex module namespace, e.g. "user" or "account/profile"
 * @param {object} [options]
 * @param {string} [options.id] - pinia store id (default = namespace)
 * @param {(initialState: any) => any} [options.mapState] - optional mapper: vuexState -> piniaState
 * @returns {() => import('pinia').Store} pinia useStore fn
 */
export function createPiniaStoreFromVuex(pinia, vuex, namespace, options = {}) {
    const id = options.id || namespace;

    const initialModuleState = getModuleState(vuex.state, namespace) || {};
    console.log(`[Vuex] Creating Pinia store from vuex module "${namespace}"`, initialModuleState);
    const baseInitialState = options.mapState
        ? options.mapState(initialModuleState)
        : initialModuleState;

    const useBaseStore = pinia.defineStore(id, {
        state: () => ({
            // shallow clone so we don't share ref
            ...baseInitialState,
        }),
    });

    /** @type {null | (() => void)} */
    let disposeBridge = null;
    let bridgeCreated = false;

    /**
     * wrapped useStore that guarantees bridge is set up once
     * @returns {import('pinia').Store}
     */
    function useBridgedStore() {
        const store = useBaseStore();

        if (!bridgeCreated) {
            bridgeCreated = true;
            disposeBridge = createVuexModulePiniaBridge({
                vuex,
                namespace,
                piniaStore: store,
            });
        }

        return store;
    }

    // optional: attach disposer for manual teardown / testing
    // @ts-ignore
    useBridgedStore.disposeBridge = () => {
        if (disposeBridge) disposeBridge();
    };

    return useBridgedStore;
}

/**
 * Create a **global Pinia store** that mirrors **vuex root state**.
 *
 * usage:
 *   const useGlobalStore = createGlobalPiniaStoreFromVuex(vuexStore)
 *   const globalStore = useGlobalStore()
 *
 * requirements:
 *   - vuex root must have mutation BRIDGE_REPLACE_ROOT_STATE(state, newState)
 *
 * @param {import('pinia')} pinia
 * @param {VuexStore} vuex
 * @param {object} [options]
 * @param {string} [options.id] - pinia id (default: 'global')
 * @param {(rootState: Record<string, any>) => any} [options.mapState] - optional mapper: vuexRoot -> piniaRoot
 * @returns {() => import('pinia').Store} pinia useStore fn
 */
export function createGlobalPiniaStoreFromVuex(pinia, vuex, options = {}) {
    const id = options.id || "global";

    const baseInitialState = options.mapState
        ? options.mapState(vuex.state)
        : vuex.state;

    const useBaseStore = pinia.defineStore(id, {
        state: () => ({
            ...baseInitialState,
        }),
    });

    /** @type {null | (() => void)} */
    let disposeBridge = null;
    let bridgeCreated = false;

    function useBridgedStore() {
        const store = useBaseStore();

        if (!bridgeCreated) {
            bridgeCreated = true;
            console.log("[Vuex] Creating global vuex-pinia bridge");
            disposeBridge = createVuexRootPiniaBridge({
                vuex,
                piniaStore: store,
            });
        }

        return store;
    }

    // @ts-ignore
    useBridgedStore.disposeBridge = () => {
        if (disposeBridge) disposeBridge();
    };

    return useBridgedStore;
}
