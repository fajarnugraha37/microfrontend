// @ts-check
import { createVuexRootPiniaBridge } from './createVuexRootPiniaBridge';

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
 * @param {import('pinia').Pinia} piniaInstance
 * @param {import('.').VuexStore} vuex
 * @param {object} [options]
 * @param {string} [options.id] - pinia id (default: 'global')
 * @param {(rootState: Record<string, any>) => any} [options.mapState] - optional mapper: vuexRoot -> piniaRoot
 * @returns {() => import('pinia').Store} pinia useStore fn
 */
export function createGlobalPiniaStoreFromVuex(pinia, piniaInstance, vuex, options = {}) {
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
        const store = useBaseStore(piniaInstance);
        console.debug(`[Vuex<->Pinia] useBridgedStore for namespace "global"@${store.$id}`);

        if (!bridgeCreated) {
            bridgeCreated = true;
            console.debug("[Vuex<->Pinia] Creating global vuex-pinia bridge");
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
