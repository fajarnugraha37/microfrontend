import createPersistedState from 'vuex-persistedstate';
import _ from "lodash";
import { authStore } from './auth';
import { productStore } from './product';
import { bridgeReplaceState } from 'mfe-components';

export const globalStore = {
  modules: {
    auth: authStore,
    product: productStore,
  },
  state: {
    counter: 0,
    token: null,
    user: null,
    config: null
  },
  mutations: {
    BRIDGE_REPLACE_ROOT_STATE(state, newRoot) {
      bridgeReplaceState.call(this, 'global', state, newRoot);
    },
    setUser(state, user) {
      state.user = user;
    },
    setToken(state, token) {
      state.token = token;
    },
    resetAuth(state) {
      state.user = null;
      state.token = null;
    },
    setConfig(state, config) {
      console.log('[Vuex] setConfig mutation called:', config);
      state.config = config;
    },
    increment(state) {
      // mutate state
      state.counter++
      if (state.user) {
        state.user.name = state.user.name + ' ' + state.counter;
        console.log('[Vuex] incremented counter and updated user name to:', state.user.name);
      }
    },
    decrement(state) {
      // mutate state
      state.counter--
    }
  },
  actions: {
    login({ commit }, payload) {
      commit('setUser', payload.user);
      commit('setToken', payload.token);
    },
    logout({ commit }) {
      commit('resetAuth');
    },
    schedularIncrement({ commit }) {
      const setIntervalId = setInterval(() => {
        commit('increment');
      }, 1000);
      console.log('[Vuex] Started schedularIncrement with id:', setIntervalId);
      setTimeout(() => {
        clearInterval(setIntervalId);
        console.log('[Vuex] Stopped schedularIncrement with id:', setIntervalId);
      }, 10000);
      return () => clearInterval(setIntervalId);
    }
  },
  getters: {
    isAuthenticated: (state) => Boolean(state.token),
    username: (state) => (state.user ? state.user.name : ''),
    config: (state) => state.config,
    counter: (state) => state.counter
  },
  plugins: [
    createPersistedState({
      key: 'common-shell',
      paths: ['token', 'user', 'config']
    })
  ]
};