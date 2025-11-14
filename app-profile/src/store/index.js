window.Vue.use(window.Vuex);

/**
 * @type {import('vuex').Store} parentVuex 
 */
export const profileStore = new window.Vuex.Store({
  state: {
    profile: {
      bio: 'Front-end engineer passionate about microfrontends.',
      interests: ['Vue.js', 'Qiankun', 'Design Systems']
    },
    sharedShell: {}
  },
  mutations: {
    updateBio(state, bio) {
      state.profile.bio = bio;
    },
    updateInterests(state, interests) {
      state.profile.interests = interests;
    },
    replaceSharedShell(state, payload) {
      state.sharedShell = { ...payload };
    }
  },
  actions: {
    saveProfile({ commit }, payload) {
      commit('updateBio', payload.bio);
      commit('updateInterests', payload.interests);
    },
    setSharedShell({ commit }, payload) {
      commit('replaceSharedShell', payload);
    }
  },
  getters: {
    profile: (state, getters, rootState) => () => state.profile,
    sharedShell: (state, getters, rootState) => () => state.sharedShell,
    sharedUser: (state, getters, rootState) => () =>
      state.sharedShell && state.sharedShell.user ? state.sharedShell.user : null
  }
});

export const store = {
  /**
   * @param {import('vuex').Store} parentVuex 
   */
  attachModule: (parentVuex) => {
    parentVuex.registerModule("profile", profileStore);
    store.value = parentVuex;
  },
  /**
   * @param {import('vuex').Store} parentVuex 
   */
  detachModule: (parentVuex) => {
    parentVuex.unregisterModule("profile");
    store.value = null;
  },
  value: null
};