import Vue from 'vue';
import Vuex from 'vuex';

Vue.use(Vuex);

export default new Vuex.Store({
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
    stats: (state) => state.stats,
    sharedShell: (state) => state.sharedShell,
    sharedUser: (state) =>
      state.sharedShell && state.sharedShell.user ? state.sharedShell.user : null
  }
});
