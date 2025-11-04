import Vue from 'vue';
import Vuex from 'vuex';

Vue.use(Vuex);

export default new Vuex.Store({
  state: {
    stats: {
      totalUsers: 1280,
      activeSessions: 87,
      satisfaction: 94
    }
  },
  mutations: {},
  actions: {},
  getters: {
    stats: (state) => state.stats
  }
});
