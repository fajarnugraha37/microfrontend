export const exampleModule = {
  namespaced: true,
  state: () => ({
    counter: 0,
    items: [],
  }),
  getters: {
    doubleCounter(state) {
      return state.counter * 2
    },
    itemsCount(state) {
      return state.items.length
    },
  },
  mutations: {
    SET_COUNTER(state, value) {
      state.counter = value
    },
    PUSH_ITEM(state, item) {
      state.items.push(item)
    },
    RESET(state) {
      state.counter = 0
      state.items = []
    },
  },
  actions: {
    increment({ commit, state }, amount = 1) {
      commit('SET_COUNTER', state.counter + amount)
    },
    addItem({ commit }, item) {
      commit('PUSH_ITEM', item)
    },
    async loadItems({ commit }) {
      // pretend to be async
      const items = await Promise.resolve(['a', 'b', 'c'])
      items.forEach(i => commit('PUSH_ITEM', i))
    }
  }
}
