/**
 * @file exampleModule.js
 * Example Vuex module compatible with both Vuex 3 and Vuex 4.
 * Demonstrates expected module structure for the bridge.
 */

export const exampleModule = {
  namespaced: true,
  state: () => ({
    count: 0,
    message: 'Hello from Vuex!'
  }),
  mutations: {
    SET_COUNT(state, value) {
      state.count = value
    },
    SET_MESSAGE(state, msg) {
      state.message = msg
    }
  },
  getters: {
    doubleCount(state) {
      return state.count * 2
    },
    messageLength(state) {
      return state.message.length
    }
  },
  actions: {
    increment({ commit, state }) {
      commit('SET_COUNT', state.count + 1)
    },
    updateMessage({ commit }, msg) {
      commit('SET_MESSAGE', msg)
    }
  }
}
