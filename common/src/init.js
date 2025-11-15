import _ from "lodash";

// internal recursive diff
function innerDiff(a, b) {
  // completely equal? no diff
  if (_.isEqual(a, b)) return undefined;

  // both arrays → compare by index
  if (Array.isArray(a) && Array.isArray(b)) {
    const maxLen = Math.max(a.length, b.length);
    const result = [];
    let changed = false;

    for (let i = 0; i < maxLen; i++) {
      const d = innerDiff(a[i], b[i]);
      if (d !== undefined) {
        result[i] = d;
        changed = true;
      }
    }

    return changed ? result : undefined;
  }

  // both plain objects → diff by key
  if (_.isPlainObject(a) && _.isPlainObject(b)) {
    const result = {};
    let changed = false;

    const keys = _.union(Object.keys(a), Object.keys(b));
    for (const k of keys) {
      const d = innerDiff(a[k], b[k]);
      if (d !== undefined) {
        result[k] = d;
        changed = true;
      }
    }

    return changed ? result : undefined;
  }

  // fallback: type differs / primitive / array vs non-array etc
  // "diff" is just "b"
  return b;
}

/* the function */
_.mixin({
  /**
   * deep diff: what you'd need to turn `a` into `b`
   * - if no diff → returns {}
   * - arrays -> index-based diffs
   * - objects -> key-based diffs
   */
  diff(a, b) {
    const d = innerDiff(a, b);
    return d === undefined ? {} : d;
  },
});
