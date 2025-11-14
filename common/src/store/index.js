import createPersistedState from 'vuex-persistedstate';

/**
 * 
 * @param {import('vue').VueConstructor} vue 
 */
export const useStore = (vue) => {
  vue.use(window.Vuex);
  /** @type {import('vuex').Store} */
  const store = new window.Vuex.Store({
    state: {
      token: null,
      user: null,
      config: null
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
      },
      setConfig(state, config) {
        state.config = config;
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
      username: (state) => (state.user ? state.user.name : ''),
      config: (state) => state.config
    },
    plugins: [
      createPersistedState({
        key: 'common-shell',
        paths: ['token', 'user', 'config']
      })
    ]
  });

  window.store = store;
}

