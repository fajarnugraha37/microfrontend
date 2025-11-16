// @ts-check
import { getModuleState } from '../utils';
import { createVuexModulePiniaBridge } from './createVuexModulePiniaBridge';
import { setupCrossTabSync } from './crossTabSync';


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
 * @param {import('.').VuexStore} vuex
 * @param {string} namespace - vuex module namespace, e.g. "user" or "account/profile"
 * @param {object} [options]
 * @param {boolean} [options.enableCrossTabSync] - enable cross-tab sync for this store (default true)
 * @param {string} [options.crossTabChannelName] - BroadcastChannel name (default 'mfe-pinia-sync')
 * @param {number} [options.crossTabThrottleMs] - throttle time for cross-tab broadcasts
 * @param {boolean} [options.enableLocalStorageFallback] - fallback to localStorage if BroadcastChannel unavailable
 * @param {string} [options.id] - pinia store id (default = namespace)
 * @param {(initialState: any) => any} [options.mapState] - optional mapper: vuexState -> piniaState
 * @returns {() => import('pinia').Store<any, any>} pinia useStore fn
 */
export function createPiniaStoreFromVuex(pinia, vuex, namespace, options = {}) {
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
    /** @type {null | (() => void)} */
    let disposeCrossTab = null;
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
            // cross-tab sync (enabled by default unless explicitly disabled)
            const enableCrossTab = (options && options.enableCrossTabSync) !== false;
            if (enableCrossTab) {
                try {
                    disposeCrossTab = setupCrossTabSync(store, {
                        channelName: (options && options.crossTabChannelName),
                        throttleMs: (options && options.crossTabThrottleMs),
                        enableLocalStorageFallback: (options && options.enableLocalStorageFallback),
                    });
                } catch (e) {
                    // ignore if host doesn't support BroadcastChannel or other errors
                    console.warn('[CrossTab] failed to setup cross-tab sync for', namespace, e);
                }
            }
        }

        return store;
    }

    // optional: attach disposer for manual teardown / testing
    // @ts-ignore
    useBridgedStore.disposeBridge = () => {
        if (disposeBridge) disposeBridge();
        if (disposeCrossTab) disposeCrossTab();
    };

    return useBridgedStore;
}