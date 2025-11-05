import { createStore } from 'vuex';

const createProfileStore = () =>
  createStore({
    state() {
      return {
        profile: {
          bio: 'Front-end engineer passionate about microfrontends.',
          interests: ['Vue.js', 'Qiankun', 'Design Systems']
        },
        sharedShell: {}
      };
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
      profile: (state) => state.profile,
      sharedShell: (state) => state.sharedShell,
      sharedUser: (state) =>
        state.sharedShell && state.sharedShell.user ? state.sharedShell.user : null
    }
  });

export default createProfileStore;
