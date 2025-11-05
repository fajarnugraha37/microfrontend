## Vuex Bridge Across Mixed Vue Runtimes (single-spa, no Qiankun)

### Why It Works

- **Bridge Is Framework-Agnostic**  
  The shell exposes its Vuex instance through `storeBridge`, a plain JavaScript object that mirrors Vuex methods (`commit`, `dispatch`, `subscribe`, `watch`, `replaceState`, etc.) and returns JSON-cloned snapshots for state. Consumer apps never touch shell internals—everything goes through this stable JS facade, so Vue version differences are irrelevant.

- **Vuex 3 API Remains Stable**  
  Both the Vue 2 shell and the Vue 3 (compat) child apps depend on Vuex 3. That API hasn’t changed across runtimes, so `store.commit('logout')` or `store.dispatch('login')` behave identically whether they’re called from Vue 2 components, Vue 3 components, or plain JavaScript. The bridge simply forwards those calls to the shell’s store.

- **Serialized Data Avoids Reactive Mismatch**  
  The bridge clones payloads via `JSON.stringify`/`JSON.parse` before passing state to consumers. Each microfrontend therefore receives plain objects/arrays, not Vue-observed data. Both Vue 2 and Vue 3 can hydrate the same POJOs without tripping over each other’s reactivity systems.

- **single-spa Custom Props Are Framework-Neutral**  
  The shell passes `storeBridge`, shared utils, and the global-state bus via single-spa `customProps`. single-spa simply forwards the object handed to it—it never inspects Vue internals—so Vue 2 and Vue 3 runtimes consume the same JavaScript contract.

- **Local Stores Stay Local**  
  Each micro app mounts its own Vuex store for UI state and consumes the bridge explicitly (e.g., `this.$microActions.dispatchToShell('logout')`). This keeps runtime-specific reactivity inside each app while still allowing cross-app mutations.

- **Clean Teardown Prevents Leaks**  
  Bridge subscriptions (`storeBridge.subscribe`, `storeBridge.watch`) are tracked in the host. The shell and both micro apps call `.teardown()` during single-spa `unmount`, so there are no lingering watchers across Vue runtimes.
- **Fallback Global State Bus**  
  We replicated Qiankun's `initGlobalState` API with an in-process event emitter (`common/src/state.js`). Child apps still interact through `$microActions.onGlobalStateChange` / `setGlobalState` without caring that the underlying implementation changed.
- **Optional Window Shims**  
  For legacy code that still expects `window.sharedUtils` or `window.appStoreBridge`, the shell exposes these globals right after registering single-spa apps and removes them on teardown. New code paths should prefer injected props, but the shim keeps partially migrated repos functional.

### Practical Takeaway

Passing the shell's Vuex context via single-spa custom props works even while the shell (Vue 2) and `app-profile` (Vue 3 compat) target different Vue versions because the boundary is still defined purely in terms of Vuex's stable, framework-agnostic API and plain JavaScript data structures. Each micro app opts into the bridge when it needs shared state, and the contract survives the move away from Qiankun since single-spa simply forwards the same objects.
