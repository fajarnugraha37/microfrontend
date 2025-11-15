export * from "./create-from-vuex";
export * from "./vuex-pinia-bridge";
import { createVuexModulePiniaBridge } from "./vuex-pinia-bridge";

/**
 * @param {import('vuex').Store} vuex
 * @param {import('pinia').Pinia} pinia
 */
export function registerBridges(vuex, pinia, modules = []) {
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
