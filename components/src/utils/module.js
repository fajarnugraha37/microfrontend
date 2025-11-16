// @ts-check

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
