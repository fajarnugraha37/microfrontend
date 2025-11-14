/**
 * Example Vuex module showing a plain object structure compatible with Vuex 3 and Vuex 4.
 * This is only an example for developers and is NOT used directly by the bridge code.
 */
export const exampleModule = {
  namespaced: true,
  state: () => ({
    count: 0,
    items: [],
  }),
  mutations: {
    SET_COUNT(state, n) {
      state.count = n
    },
    PUSH_ITEM(state, item) {
      state.items.push(item)
    },
  },
  getters: {
    itemCount(state) {
      return state.items.length
    }
  },
  actions: {
    incrementAsync({ commit, state }, delta = 1) {
      return new Promise((resolve) => {
        setTimeout(() => {
          commit('SET_COUNT', state.count + delta)
          resolve()
        }, 100)
      })
    }
  }
}
