import Vue from 'vue';
import Vuex from 'vuex';
import createPersistedState from 'vuex-persistedstate';

Vue.use(Vuex);

export default new Vuex.Store({
  state: {
    token: null,
    user: null
  },
  mutations: {
    setUser(state, user) {
      state.user = user;
    },
    setToken(state, token) {
      state.token = token;
    },
    resetAuth(state) {
      state.user = null;
      state.token = null;
    }
  },
  actions: {
    login({ commit }, payload) {
      commit('setUser', payload.user);
      commit('setToken', payload.token);
    },
    logout({ commit }) {
      commit('resetAuth');
    }
  },
  getters: {
    isAuthenticated: (state) => Boolean(state.token),
    username: (state) => (state.user ? state.user.name : '')
  },
  plugins: [
    createPersistedState({
      key: 'common-shell',
      paths: ['token', 'user']
    })
  ]
});
