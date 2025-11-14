import { AuthService } from '../services/auth';

const state = {
  token: localStorage.getItem('auth_token') || '',
  user: null,
};

const mutations = {
  setToken(state, token) {
    state.token = token;
    localStorage.setItem('auth_token', token);
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
    localStorage.removeItem('auth_token');
  },
};

export default {
  namespaced: true,
  state,
  mutations,
  actions,
};
