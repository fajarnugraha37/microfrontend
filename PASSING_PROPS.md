## Vuex Bridge Across Mixed Vue Runtimes

### Why It Works

- **Bridge Is Framework-Agnostic**  
  The shell exposes its Vuex instance through `storeBridge`, a plain JavaScript object that mirrors Vuex methods (`commit`, `dispatch`, `subscribe`, `watch`, `replaceState`, etc.) and returns JSON-cloned snapshots for state. Consumer apps never touch shell internals—everything goes through this stable JS facade, so Vue version differences are irrelevant.

- **Vuex 3 API Remains Stable**  
  Both the Vue 2 shell and the Vue 3 (compat) child apps depend on Vuex 3. That API hasn’t changed across runtimes, so `store.commit('logout')` or `store.dispatch('login')` behave identically whether they’re called from Vue 2 components, Vue 3 components, or plain JavaScript. The bridge simply forwards those calls to the shell’s store.

- **Serialized Data Avoids Reactive Mismatch**  
  The bridge clones payloads via `JSON.stringify`/`JSON.parse` before passing state to consumers. Each microfrontend therefore receives plain objects/arrays, not Vue-observed data. Both Vue 2 and Vue 3 can hydrate the same POJOs without tripping over each other’s reactivity systems.

- **Qiankun Prop Pipeline Is Version-Blind**  
  Qiankun passes `storeBridge` to micro apps as an opaque prop. It doesn’t inspect Vue internals, so different Vue runtimes can coexist; they just get a reference to a JavaScript object.

- **Local Stores Stay Local**  
  Each micro app mounts its own Vuex store for UI state and consumes the bridge explicitly (e.g., `this.$microActions.dispatchToShell('logout')`). This keeps runtime-specific reactivity inside each app while still allowing cross-app mutations.

- **Clean Teardown Prevents Leaks**  
  Bridge subscriptions (`storeBridge.subscribe`, `storeBridge.watch`) are tracked and disposed in Qiankun’s `unmount`. There are no lingering watchers tied to Vue 2 or Vue 3 lifecycles, so unmounting one runtime doesn’t destabilize the other.

### Practical Takeaway

Passing the shell’s Vuex context through Qiankun props works even while the shell (Vue 2) and `app-profile` (Vue 3 compat) are on different Vue versions because the boundary is defined purely in terms of Vuex’s stable, framework-agnostic API and plain JavaScript data structures. Each micro app opts into the bridge when it needs shared state, and the shared contract stays valid until we eventually graduate everything to a single Vue runtime.
