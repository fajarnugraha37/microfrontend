// @ts-check
import { getModuleState } from '../utils';
import { createVuexModulePiniaBridge } from './createVuexModulePiniaBridge';


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
 * @param {import('pinia').Pinia} piniaInstance
 * @param {import('.').VuexStore} vuex
 * @param {string} namespace - vuex module namespace, e.g. "user" or "account/profile"
 * @param {object} [options]
 * @param {string} [options.id] - pinia store id (default = namespace)
 * @param {(initialState: any) => any} [options.mapState] - optional mapper: vuexState -> piniaState
 * @returns {() => import('pinia').Store} pinia useStore fn
 */
export function createPiniaStoreFromVuex(pinia, piniaInstance, vuex, namespace, options = {}) {
    const id = options.id || namespace;

    const initialModuleState = getModuleState(vuex.state, namespace) || {};
    console.debug(`[Vuex<->Pinia] Creating Pinia store from vuex module "${namespace}"`, initialModuleState);
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
        const store = useBaseStore(piniaInstance);
        console.debug(`[Vuex<->Pinia] useBridgedStore for namespace "${namespace}"@${store.$id}`);

        if (!bridgeCreated) {
            bridgeCreated = true;
            console.debug(`[Vuex<->Pinia] Creating ${namespace} vuex-pinia bridge`);
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