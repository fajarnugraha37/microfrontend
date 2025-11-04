import Vue from 'vue';
import Vuex from 'vuex';

Vue.use(Vuex);

export default new Vuex.Store({
  state: {
    profile: {
      bio: 'Front-end engineer passionate about microfrontends.',
      interests: ['Vue.js', 'Qiankun', 'Design Systems']
    }
  },
  mutations: {
    updateBio(state, bio) {
      state.profile.bio = bio;
    },
    updateInterests(state, interests) {
      state.profile.interests = interests;
    }
  },
  actions: {
    saveProfile({ commit }, payload) {
      commit('updateBio', payload.bio);
      commit('updateInterests', payload.interests);
    }
  },
  getters: {
    profile: (state) => state.profile
  }
});
