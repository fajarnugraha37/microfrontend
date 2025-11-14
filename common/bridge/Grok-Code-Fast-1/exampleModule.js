/**
 * Example Vuex module demonstrating the structure expected by the bridge.
 * This module is compatible with both Vuex 3 and Vuex 4.
 * The bridge can proxy any module with this structure, regardless of domain.
 */

/**
 * Example Vuex module state factory
 * @returns {Object} Initial state
 */
const state = () => ({
  items: [],
  loading: false,
  error: null,
});

/**
 * Mutations for the example module
 */
const mutations = {
  /**
   * Set the items array
   * @param {Object} state - Module state
   * @param {Array} items - New items
   */
  SET_ITEMS(state, items) {
    state.items = items;
  },

  /**
   * Set loading state
   * @param {Object} state - Module state
   * @param {boolean} loading - Loading status
   */
  SET_LOADING(state, loading) {
    state.loading = loading;
  },

  /**
   * Set error state
   * @param {Object} state - Module state
   * @param {Error|string|null} error - Error object or message
   */
  SET_ERROR(state, error) {
    state.error = error;
  },
};

/**
 * Getters for the example module
 */
const getters = {
  /**
   * Get items count
   * @param {Object} state - Module state
   * @returns {number} Number of items
   */
  itemsCount: (state) => state.items.length,

  /**
   * Check if there are any items
   * @param {Object} state - Module state
   * @returns {boolean} True if items exist
   */
  hasItems: (state) => state.items.length > 0,

  /**
   * Get loading status
   * @param {Object} state - Module state
   * @returns {boolean} Loading status
   */
  isLoading: (state) => state.loading,

  /**
   * Get current error
   * @param {Object} state - Module state
   * @returns {Error|string|null} Current error
   */
  currentError: (state) => state.error,
};

/**
 * Actions for the example module
 */
const actions = {
  /**
   * Load items asynchronously
   * @param {Object} context - Vuex action context
   */
  async loadItems({ commit }) {
    commit('SET_LOADING', true);
    commit('SET_ERROR', null);

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      const items = [
        { id: 1, name: 'Item 1' },
        { id: 2, name: 'Item 2' },
        { id: 3, name: 'Item 3' },
      ];
      commit('SET_ITEMS', items);
    } catch (error) {
      commit('SET_ERROR', error.message || 'Failed to load items');
    } finally {
      commit('SET_LOADING', false);
    }
  },

  /**
   * Add a new item
   * @param {Object} context - Vuex action context
   * @param {Object} item - Item to add
   */
  addItem({ commit, state }, item) {
    const newItems = [...state.items, { ...item, id: Date.now() }];
    commit('SET_ITEMS', newItems);
  },

  /**
   * Remove an item by id
   * @param {Object} context - Vuex action context
   * @param {number} itemId - ID of item to remove
   */
  removeItem({ commit, state }, itemId) {
    const newItems = state.items.filter(item => item.id !== itemId);
    commit('SET_ITEMS', newItems);
  },
};

/**
 * Example Vuex module definition
 * This structure works with both Vuex 3 and Vuex 4
 */
export const exampleModule = {
  namespaced: true,
  state,
  mutations,
  getters,
  actions,
};