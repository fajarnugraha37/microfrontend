import { AuthService } from '../services/auth';

const state = {
  token: '', // Only set from Vuex mutations/actions
  user: null,
};

const mutations = {
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

export default {
  namespaced: true,
  state,
  mutations,
  actions,
};
