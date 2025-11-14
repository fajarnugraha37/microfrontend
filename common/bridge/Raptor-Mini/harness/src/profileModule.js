export const profileModule = {
  namespaced: true,
  state: () => ({
    profile: {
      bio: 'Front-end engineer passionate about microfrontends.',
      interests: ['Vue.js', 'Qiankun', 'Design Systems']
    },
    sharedShell: {}
  }),
  getters: {
    profile(state) {
      return state.profile
    },
    sharedShell(state) {
      return state.sharedShell
    },
    sharedUser(state) {
      return state.sharedShell && state.sharedShell.user ? state.sharedShell.user : null
    }
  },
  mutations: {
    updateBio(state, bio) {
      state.profile.bio = bio
    },
    updateInterests(state, interests) {
      state.profile.interests = interests
    },
    replaceSharedShell(state, payload) {
      state.sharedShell = { ...payload }
    }
  },
  actions: {
    saveProfile({ commit, state }, payload) {
      commit('updateBio', payload.bio)
      commit('updateInterests', payload.interests)
    },
    setSharedShell({ commit }, payload) {
      commit('replaceSharedShell', payload)
    }
  }
}
