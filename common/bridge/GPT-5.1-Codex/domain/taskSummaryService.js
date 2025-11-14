/**
 * Pure domain helpers that can be shared by both Vuex and Pinia layers.
 * These functions never import Vue, Vuex, or Pinia. They only manipulate plain data,
 * which makes them portable to other runtimes (node services, tests, etc.).
 */

/**
 * @typedef {Object} Task
 * @property {string} id
 * @property {boolean} done
 * @property {string} [label]
 */

/**
 * @typedef {Object} TaskSummary
 * @property {number} total
 * @property {number} completed
 * @property {number} pending
 * @property {number} completionRate
 */

/**
 * Compute aggregate stats for a list of tasks.
 *
 * @param {Task[]} tasks
 * @returns {TaskSummary}
 */
export function summarizeTasks(tasks) {
  const list = Array.isArray(tasks) ? tasks : [];
  const total = list.length;
  const completed = list.filter((task) => Boolean(task && task.done)).length;
  const pending = total - completed;
  return {
    total,
    completed,
    pending,
    completionRate: total === 0 ? 0 : Number((completed / total).toFixed(2)),
  };
}

/**
 * Decide a generic status tag (idle, loading, complete) based on counts.
 *
 * @param {TaskSummary} summary
 * @returns {'idle' | 'complete' | 'incomplete'}
 */
export function resolveStatus(summary) {
  if (!summary || typeof summary.total === 'undefined') {
    return 'idle';
  }
  if (summary.total === 0) {
    return 'idle';
  }
  if (summary.completed === summary.total) {
    return 'complete';
  }
  return 'incomplete';
}
