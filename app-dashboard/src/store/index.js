window.Vue.use(window.Vuex);

/**
 * @type {import('vuex').Store} parentVuex 
 */
export const appDashboardStore = new window.Vuex.Store({
  state: {
    stats: {
      totalUsers: 1280,
      activeSessions: 87,
      satisfaction: 94
    },
    sharedShell: {}
  },
  mutations: {
    replaceSharedShell(state, payload) {
      state.sharedShell = { ...payload };
    }
  },
  actions: {
    setSharedShell({ commit }, payload) {
      commit('replaceSharedShell', payload);
    }
  },
  getters: {
    stats: (state) => {
      return () => state.stats;
    },
    sharedShell: (state) => () => state.sharedShell,
    sharedUser: (state) => () =>
      state.sharedShell && state.sharedShell.user ? state.sharedShell.user : null
  }
});


export const store = {
  /**
   * @param {import('vuex').Store} parentVuex 
   */
  attachModule: (parentVuex) => {
    parentVuex.registerModule("dashboard", appDashboardStore);
    store.value = parentVuex;
  },
  /**
   * @param {import('vuex').Store} parentVuex 
   */
  detachModule: (parentVuex) => {
    parentVuex.unregisterModule("dashboard");
    store.value = null;
  },
  value: null
};