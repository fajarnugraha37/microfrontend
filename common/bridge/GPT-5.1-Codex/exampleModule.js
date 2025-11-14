import { resolveStatus, summarizeTasks } from './domain/taskSummaryService.js';

/**
 * Example Vuex module showcasing a definition that works in both Vuex 3 and Vuex 4.
 * The module itself is generic and does not know about Pinia. Business logic lives in
 * domain helpers under ./domain to keep it framework-agnostic.
 */
export const exampleModule = {
  namespaced: true,
  state: () => ({
    tasks: [],
    status: 'idle',
    lastLoadedAt: null,
  }),
  getters: {
    totalTasks(state) {
      return Array.isArray(state.tasks) ? state.tasks.length : 0;
    },
    completionSummary(state) {
      return summarizeTasks(state.tasks);
    },
    statusTag(state, getters) {
      return resolveStatus(getters.completionSummary);
    },
  },
  mutations: {
    SET_TASKS(state, payload) {
      state.tasks = Array.isArray(payload) ? payload : [];
      state.lastLoadedAt = Date.now();
    },
    SET_STATUS(state, status) {
      state.status = status;
    },
  },
  actions: {
    async fetchTasks({ commit }, fetcher) {
      commit('SET_STATUS', 'loading');
      const tasks = typeof fetcher === 'function' ? await fetcher() : [];
      commit('SET_TASKS', tasks);
      commit('SET_STATUS', 'idle');
      return tasks;
    },
  },
};
