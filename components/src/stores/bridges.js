// @ts-check
import { deepPatch } from "../utils";
import { createVuexModulePiniaBridge } from "./createVuexModulePiniaBridge";

/**
 * @param {import(".").VuexStore} vuex
 * @param {import('pinia').Pinia} pinia
 * @param {{ store: () => import('pinia').Store; namespace: string }[]} modules
 */
// @ts-ignore
export const registerBridges = window.$__registerBridges = (vuex, pinia, modules = []) => {
    /**
     * @type {(() => void)[]}
     */
    const disposers = [];
    for (const module of modules) {
        const store = module.store();
        const namespace = module.namespace;
        disposers.push(
            createVuexModulePiniaBridge({
                vuex,
                namespace,
                piniaStore: store,
            })
        );
    }

    return () => disposers.forEach((fn) => fn());
}


/**
 * 
 * @param {string} namespace 
 * @param {Record<string, any>} state 
 * @param {Record<string, any>} newRoot 
 */
export const bridgeReplaceState = window.$__bridgeReplaceState = function (namespace, state, newRoot) {
    deepPatch(state, newRoot);
    console.debug(`[Pinia->Vuex] committed ${namespace}/BRIDGE_REPLACE_STATE`);
}