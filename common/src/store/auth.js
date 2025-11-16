import { AuthService } from '../services/auth';
import { bridgeReplaceState } from 'mfe-components';

const state = {
  token: '', // Only set from Vuex mutations/actions
  user: null,
};

const mutations = {
  BRIDGE_REPLACE_STATE(state, newRoot) {
    bridgeReplaceState.call(this, 'auth', state, newRoot);
  },
  setToken(state, token) {
    state.token = token;
  },
  setUser(state, user) {
    state.user = user;
  },
};

const actions = {
  async login({ commit }, { username, password }) {
    const service = AuthService();
    const res = await service.login({ username, password });
    commit('setToken', res.data.token);
    commit('setUser', res.data.user);
  },
  async refreshToken({ commit, state }) {
    const service = AuthService();
    const res = await service.refreshToken({ refreshToken: state.token });
    commit('setToken', res.data.token);
  },
  logout({ commit }) {
    commit('setToken', '');
    commit('setUser', null);
  },
};

export const authStore = {
  namespaced: true,
  state: state,
  mutations: mutations,
  actions: actions,
};
