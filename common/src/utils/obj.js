// deepPatch.js
// @ts-check

/**
 * Deeply applies `patch` into `target`:
 * - plain objects are merged recursively
 * - arrays are replaced as a whole
 * - primitives are assigned directly
 *
 * @param {any} target
 * @param {any} patch
 */
export function deepPatch(target, patch) {
    if (!patch || typeof patch !== "object") return;

    for (const key of Object.keys(patch)) {
        const next = patch[key];
        const prev = target[key];

        // if patch value is a plain object -> recurse
        if (
            next &&
            typeof next === "object" &&
            !Array.isArray(next)
        ) {
            if (
                !prev ||
                typeof prev !== "object" ||
                Array.isArray(prev)
            ) {
                // make sure we have an object to merge into
                target[key] = {};
            }

            deepPatch(target[key], next);
            continue;
        }

        // arrays & primitives: just replace
        target[key] = next;
    }
}
