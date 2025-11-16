// @ts-check
import { createVuexRootPiniaBridge } from './createVuexRootPiniaBridge';
import { setupCrossTabSync } from './crossTabSync';

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
 * @param {import('.').VuexStore} vuex
 * @param {object} [options]
 * @param {boolean} [options.enableCrossTabSync] - enable cross-tab sync for this store (default true)
 * @param {string} [options.crossTabChannelName] - BroadcastChannel name (default 'mfe-pinia-sync')
 * @param {number} [options.crossTabThrottleMs] - throttle time for cross-tab broadcasts
 * @param {boolean} [options.enableLocalStorageFallback] - fallback to localStorage if BroadcastChannel unavailable
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
    /** @type {null | (() => void)} */
    let disposeCrossTab = null;
    let bridgeCreated = false;

    function useBridgedStore() {
        const store = useBaseStore();

        if (!bridgeCreated) {
            bridgeCreated = true;
            console.debug("[Vuex<->Pinia] Creating global vuex-pinia bridge");
            disposeBridge = createVuexRootPiniaBridge({
                vuex,
                piniaStore: store,
            });
            const enableCrossTab = (options && options.enableCrossTabSync) !== false;
            if (enableCrossTab) {
                try {
                    disposeCrossTab = setupCrossTabSync(store, {
                        channelName: (options && options.crossTabChannelName),
                        throttleMs: (options && options.crossTabThrottleMs),
                        enableLocalStorageFallback: (options && options.enableLocalStorageFallback),
                    });
                } catch (e) {
                    console.warn('[CrossTab] failed to setup cross-tab sync for global store', e);
                }
            }
        }

        return store;
    }

    // @ts-ignore
    useBridgedStore.disposeBridge = () => {
        if (disposeBridge) disposeBridge();
        if (disposeCrossTab) disposeCrossTab();
    };

    return useBridgedStore;
}
