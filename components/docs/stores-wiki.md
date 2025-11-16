# Stores: Vuex ↔ Pinia Bridge — Architecture & Migration Guide

This documentation describes the store bridge utilities under `src/stores` in the `mfe-components` repository. It provides architecture, reasoning, flow diagrams (conceptual), usage examples, recommended migration steps for partial Vue 2 → Vue 3 / Vuex → Pinia migrations, FAQ, limitations and future improvements.

---

## Intro & Purpose

This module set helps microfrontends do a *controlled and iterative migration* from Vuex (Vue 2-style) to Pinia (Vue 3-style) by offering:

- A consistent global `Vuex` root store that exists once and is used to source application state.
- Per-module Pinia "derived" stores that mirror respective Vuex modules via a two-way sync bridge.
- Utilities & plugins to easily install the bridge on both Vue 2 (Vuex-hosted) and Vue 3 (Pinia-hosted) apps so microfrontends can coexist and share state safely.

The bridging approach focuses on enabling partial migration: keep Vuex (root) and gradually introduce Pinia stores for specific modules until migration completes.

---

## Problem Statement

Many large codebases and microfrontend ecosystems have multiple independent applications (host / shell + child MFEs) that rely on a *shared global state* — historically hosted as a Vuex root store. Migrating every application at once to Vue 3 and Pinia is often impractical. The challenges include:

- Different app lifecycles and deployment velocities for each microfrontend team.
- Host and microfrontend tech mismatch: the host may stay Vue 2 (Vuex) while microfrontends upgrade to Vue 3 (Pinia) incrementally.
- Shared domain logic that must remain consistent across app boundaries (user session, auth, cart, settings).
- Minimizing runtime disruptions and avoiding double-state scenarios, especially while both Vuex and Pinia live in the same runtime.
- Opt-in state migration per module or per MFE without global refactors.
- Maintaining developer DX (autocompletion, typed interfaces) and minimizing runtime bundle/interop issues.

The core problem: How to let microfrontends migrate to Pinia without breaking existing Vuex consumers, while maintaining consistent and correct state synchronization and avoiding race conditions or data loss.

---

## Brief Solutions (Overview)

Below are common strategies to solve the above challenges along with a short summary of tradeoffs and recommended scenarios.

1) **Two-way Bridge (this repository pattern)**
   - Description: Keep the host's Vuex store, and expose a set of utilities that create per-module Pinia stores in microfrontends and sync state both ways.
   - Pros:
     - Incremental migration: migrate a single module or MFE at a time.
     - Minimal host code changes — the host holds the single source of truth until cutover.
     - Microfrontends can use reactive Pinia stores and enjoy modern developer tooling.
   - Cons:
     - Complexity: locks to avoid cycles, diff/patch logic, potential performance overhead for frequent or large updates.
     - Requires mutations (`BRIDGE_REPLACE_*`) on host modules and `window` global references by default.
   - Best for: Large, distributed teams and gradual migration where the host cannot be upgraded to Vue 3 immediately.

2) **Full Host Migration to Pinia**
   - Description: Migrate the host first to Pinia (Vue 3), then standardize microfrontends to use the same Pinia stores or shared modules.
   - Pros:
     - Long-term simplification: reduces the need for bridging code and `window` globals.
     - Better type & tooling uniformity across projects.
   - Cons:
     - Host migration may be expensive and risky if the host has tight coupling with Vue 2 / Vuex or lots of legacy code.
   - Best for: When the host can be updated / refactored in a planned release and teams are ready for a more coherent future state.

3) **One-way Sync or Temporary Mirror**
   - Description: Only mirror Vuex -> Pinia (read-only) or Pinia -> Vuex (write-only) during a period of migration to lower complexity.
   - Pros:
     - Reduced complexity and avoid loops.
     - Can be used as a stepping-stone for a controlled migration.
   - Cons:
     - Two-way coherence not guaranteed — more careful planning of where write traffic occurs.
   - Best for: When you want to guarantee no accidental writes from the newer store; can be used to test and stabilize behavior.

4) **Backend/Server-driven State (no shared runtime store)**
   - Description: Avoid runtime shared state — move to server-driven state or a sync API that allows each app to request what it needs.
   - Pros:
     - Simplifies runtime interactions; apps become decoupled and rely on a central API/service.
     - Ideal for multi-platform setups.
   - Cons:
     - Increased API traffic and potential latency; not ideal for high-frequency UI updates.
     - More significant architecture change.
   - Best for: Larger system migrations where shared runtime state is undesirable or where cross-app state should be centralized in a shared service.

5) **Event-Bus / Message-based Interop**
   - Description: Use a cross-app event bus (`postMessage` in iframes, or in-window event bus) to propagate changes instead of synching stores.
   - Pros:
     - Looser coupling: only exchange intents or events not entire state object.
   - Cons:
     - Need to implement idempotency and state reconciliation in event handlers.
   - Best for: Use cases where apps need only occasional or discrete updates; not suitable for large object graphs requiring precise syncing.

6) **Shared Module/Dependency with Consumer Exports**
   - Description: Publish shared stores (Pinia) as an NPM module or package that host + MFEs import and configure to ensure a single owner of state.
   - Pros:
     - Clear single source of truth; developer-friendly imports and typed usage.
   - Cons:
     - Requires packaging & versioning discipline; may not work during incremental migration without a bridging layer.
   - Best for: When you can coordinate versioning and release cycles across MFEs and host.

---

## Recommended Approach & Rationale

For incremental migrations where the host remains Vue 2 for a period of time, the Two-way Bridge approach (the one in this repository) is typically the most pragmatic solution:

- It enables per-module migration without forcing a big-bang host upgrade, which reduces risk.
- It allows microfrontend teams to use modern tooling (Pinia) while retaining the host as the single source of truth.
- The tradeoffs (diff/patch logic, lazy bridge creation, mutex) are manageable and can be mitigated by monitoring, limiting diff sizes, and proper testing.

Once all MFEs and internal host modules are migrated to Pinia and the host is also upgraded to Vue 3, move to a shared Pinia model and remove the bridging layer (see Post-Migration Cleanup above).

---

---

## Files

- `src/stores/index.js` — Main exports & runtime helper entry points used by `mfe-components`. Exports bridging utilities and convenience helpers.
- `src/stores/bridges.js` — Utilities to register or create bridges and a simple helper `bridgeReplaceState` used by the mutation to update vuex state.
- `src/stores/createPiniaStoreFromVuex.js` — `createPiniaStoreFromVuex` creates a Pinia store for a specific Vuex module and sets up a lazy bridge.
- `src/stores/createGlobalPiniaStoreFromVuex.js` — Creates a Pinia store mirroring the Vuex root state and sets up the bridge at first use.
- `src/stores/createVuexModulePiniaBridge.js` — Implementation of a 2-way sync for a *vuex module* ↔ *pinia store*.
- `src/stores/createVuexRootPiniaBridge.js` — Implementation of a 2-way sync for *vuex root* ↔ *pinia global store*.

---

## Goals & Design Principles

1. Non-invasive, iterative migration: keep the Vuex root but allow apps to plug Pinia derived stores that mirror Vuex module's state.
2. Lazily initialize bridges to minimize startup overhead.
3. Two-way synchronization: changes in either the Vuex side or the Pinia side propagate to the other.
4. Avoid loops and race conditions: use flags and a mutex to prevent cycles and concurrent modifications.
5. Support both Vue 2 host (Vuex-based) and Vue 3 microfrontends (Pinia-based) coexisting.

---

## High-Level Architecture & Flow

1. Host / Root (Vue 2):
   - A global Vuex store (root) exists and is registered with `useVuexStore(Vue, globalStoreConfig)`.
   - For migrating microfrontends, the Vuex modules provide state and possibly server/logic continuity.

2. Migrated Microfrontends (Vue 3 / Pinia):
   - Microfrontends import helper plugin `usePiniaStore(pinia)`, then `app.use(usePiniaStore(pinia))`.
   - The plugin will create a global Pinia store mirroring Vuex root state (with `createGlobalPiniaStoreFromVuex`) and Pinia derived stores for each module (`createPiniaStoreFromVuex`).

3. Two-way Bridge Communication:
   - Vuex -> Pinia: the module or root `subscribe` notices changes and calculates a diff; it deep-patches the pinia store accordingly.
   - Pinia -> Vuex: the pinia `$subscribe` posts a `BRIDGE_REPLACE_STATE` (module-scope) or `BRIDGE_REPLACE_ROOT_STATE (root) commit` so Vuex updates are performed via a controlled mutation.

4. Conflict / Cycle Avoidance:
   - Each bridge tracks `syncingFromVuex` and `syncingFromPinia` flags to avoid cycles and reentrancy.
   - A `Mutex` is used to provide additional concurrency protection and to avoid interleaving modification during long async flows.

-- Example flow

- User clicks in a Vue 3 component → triggers a Pinia mutation
- Pinia `$subscribe` sees the mutation, runs synchronizing logic → commits `BRIDGE_REPLACE_STATE` to Vuex
- Vuex mutation runs and invokes `vuex.subscribe` registered on the bridge → obj patch is applied in Pinia if diffed
- Cycle protection flags ensure the bridge doesn't produce an infinite loop

### Architecture Diagram

Mermaid diagram (preferred for generated docs viewers):

```mermaid
graph LR
  Host[Host (Shell) – Vue 2 + Vuex]
  Host -->|exposes| Window[window.globalStore/window.store]
  Window --> BridgeManager[Bridge Manager / Utilities]
  BridgeManager --> MFE1[Microfrontend A – Vue 3 + Pinia]
  BridgeManager --> MFE2[Microfrontend B – Vue 3 + Pinia]
  MFE1 <--> Host
  MFE2 <--> Host
  Host -.->|BRIDGE_REPLACE_*| VuexMutations[Vuex Mutations]
  MFE1 -.->|Pinia $subscribe| PiniaMutations[Pinia Mutations]
  click BridgeManager "#arch-notes" "Bridge Manager details"
```

ASCII fallback example (if mermaid is not supported):

```
  [Host: Vue2 + Vuex]
      | exposes
      v
  [window.globalStore / window.store] <-> [BridgeManager] <-> [MFE: Vue3 + Pinia]
      ^                                 ^                   ^
      |                                 |                   |
  (Vuex subscribe)               (Bridge awares)        (Pinia $subscribe)
```

#### Notes on Diagram
- The Host (host shell) holds a Vuex root store and module stores. The Host sets `window.store` and `window.globalStore`.
- The Bridge Manager sits inside the `mfe-components` library and is used by microfrontends to create derived stores and establish sync.
- Microfrontends (MFE) implement Pinia stores derived from a module or the global state; they receive updates from the Host and can push updates back via a controlled mutation.

---

## Implementation Details

### Diff & Patching

- Utility: `_.diff` from `src/initialize.js` (lodash mixin) computes a minimal diff between two plain objects (or arrays) and returns an object describing changes.
- Patch: `deepPatch` applies that `diff` incrementally into the target state (object merging unless the value is an array/primitives which replace the whole nested value).
- Only apply changes if diff is non-empty to avoid unnecessary writes.

### Guard Flags & Mutex

- `syncingFromVuex` and `syncingFromPinia` booleans toggle the direction of in-flight operations and avoid re-triggering the opposite subscription.
- A `Mutex` (`async-mutex`) wraps both `vuex.subscribe` and `pinia.$subscribe` callbacks to avoid interleaving header invalidation and ensure correctness in concurrent operations.

### Required Vuex Mutations

Bridging expects Vuex modules (and root) support two special mutations:

- `BRIDGE_REPLACE_STATE` — To replace (or partially replace with deep patch) a module's state — used when Pinia commits changes.
- `BRIDGE_REPLACE_ROOT_STATE` — To replace (or partially replace) root state — used when Pinia commits changes to the root.

If the mutations do not exist, bridge calls should still attempt to call them — but you'd typically add the mutation skeletons in your Vuex modules (they can call `Object.assign(state, newState)` or use `deepPatch` to apply changes).

Example Vuex module snippet:

```js
// store/modules/user.js
const state = () => ({ name: 'Alice', settings: { theme: 'dark' } });

const mutations = {
  BRIDGE_REPLACE_STATE(state, payload) {
    // apply payload into the module state
    // simple replace for example; you can use deepPatch if you want partial merges
    Object.assign(state, payload);
  },
  // ... other mutations
};

export default { namespaced: true, state, mutations };
```

### Lazy Bridge Creation

- `createPiniaStoreFromVuex(pinia, vuex, namespace)` returns a `useBridgedStore()` factory; the actual bridging (via `createVuexModulePiniaBridge`) only runs the first time a store is consumed — avoids extra overhead for unused modules.
- `createGlobalPiniaStoreFromVuex` behaves similarly for root-level store.

### How `usePiniaStore` plugin operates (Vue 3)

- The plugin installs a `bridgeStore` (global pinia store from Vuex root) and sets up per-module derived stores using `createPiniaStoreFromVuex`.
- It also updates `app.config.globalProperties` and calls `app.provide` so any microfrontend or internal component can `inject`/pull the correct derived store.
- It stores references in `window.derivedStore` & `window.bridgeStore` for convenience (global debugging).

---

## API Reference (summary)

- `useVuexStore(Vue, globalStore)` — Vue 2 helper. Installs `Vuex` on Vue and creates `window.store` and `window.globalStore` from `globalStore` config.

- `usePiniaStore(pinia)` — returns a Vue 3 plugin that, when installed via `app.use(usePiniaStore(pinia))`, creates the global bridge store and derived stores and wires them into the app.

- `useDerivedStore(pinia, namespace, options)` — convenience: creates a per-module bridged store for a given vuex module `namespace` from `window.globalStore`.

- `createPiniaStoreFromVuex(pinia, vuex, namespace, options)` — returns a `useStore` factory tied to a namespace; when first used it attaches a module bridge.

- `createGlobalPiniaStoreFromVuex(pinia, vuex, options)` — returns a `useStore` function that mirrors root state.

- `createVuexModulePiniaBridge({ vuex, namespace, piniaStore })` — low-level bridge implementation, returns a `dispose()` function.

- `createVuexRootPiniaBridge({ vuex, piniaStore })` — low-level bridge for root.

- `registerBridges(vuex, pinia, modules)` — registers a bunch of derived bridges at once (useful if you manually want to register module bridges). Returns a combined `disposeAll` function.

- `bridgeReplaceState(namespace, state, newRoot)` — helper that deep patches `state` with `newRoot` — used in your mutation handler.

---

## Example Usage (Vue 2 host and Vue 3 microfrontend)

### 1) Vue 2 Application (Root/Host) — set global store

```js
// main.v2.js
import Vue from 'vue';
import Vuex from 'vuex';
import { useVuexStore } from 'mfe-components';

// your existing root config
const globalStoreConfig = {
  state: { ... },
  mutations: {
    BRIDGE_REPLACE_ROOT_STATE(state, payload) {
      // apply payload; use deepPatch or Object.assign
      Object.assign(state, payload);
    }
  },
  modules: {
    user: {
      namespaced: true,
      state: { name: 'Alice' },
      mutations: {
        BRIDGE_REPLACE_STATE(state, payload) {
          Object.assign(state, payload);
        }
      }
    }
  }
}

// register a host store and make it available globally
useVuexStore(Vue, globalStoreConfig);
```

### 2) Vue 3 Microfrontend using Pinia — install plugin & derived stores

```js
// microfrontend.v3 main.js
import { createApp } from 'vue';
import { createPinia } from 'pinia';
import { usePiniaStore, useDerivedStore } from 'mfe-components';

const app = createApp(App);
const pinia = createPinia();
app.use(pinia);

// plugin will create globalPinia bridge store & derived stores using window.globalStore
app.use(usePiniaStore(pinia));

// Example: get derived user store
const useUserStore = useDerivedStore(pinia, 'user');
const userStore = useUserStore();

// userStore is a normal pinia store with reactive access to user state and actions
```

### 3) Using derived store per-component (Vue 3)

```js
import { defineComponent } from 'vue';
import { useDerivedStore } from 'mfe-components';

export default defineComponent({
  setup() {
    const useUserStore = useDerivedStore(pinia, 'user');
    const userStore = useUserStore();
    // userStore mirrors the Vuex `user` module
  }
});
```

### 4) Registering specific bridges manually (server-run or initialization)

If you want to only create bridges for `user` and `cart` modules and not all modules:

```js
import { registerBridges } from 'mfe-components';

const dispose = registerBridges(window.store, pinia, [
  { store: () => useDerivedStore(pinia, 'user')(), namespace: 'user' },
  { store: () => useDerivedStore(pinia, 'cart')(), namespace: 'cart' },
]);

// later to clean up:
// dispose();
```

---

## Detailed Behavior & Flow (Edge Cases)

- When Vuex triggers `subscribe` with a mutation that is not a `BRIDGE_REPLACE_*` operation, we compute the diff between the plugin's pinia state and the new `state` coming from Vuex. Only the diff is patch-applied into the Pinia store.
- When Pinia triggers a `$subscribe`, we rely on `mutation.payload` to send a new nested object for Vuex to commit via `BRIDGE_REPLACE_*`.
- If Pinia's mutation doesn't include `payload` (e.g., field-iterator mutations), we log and skip it (see code: it only commits when `payload` exists).

---

## FAQ — Common Questions

Q: "What do I need to add in my Vuex modules to support bridging?"
- A: Ensure you have a `BRIDGE_REPLACE_STATE` mutation in the module and `BRIDGE_REPLACE_ROOT_STATE` for the root store. Those mutations should safely merge or apply the incoming patch (preferably using the `deepPatch` helper).

Q: "Why would I see an `Object(...) is not a function` runtime error when importing functions?"
- A: Usually this is an interoperability / bundler issue. Check whether you imported the named exports vs default, and whether your bundler is resolving the ESM vs CJS artifacts correctly. Recommended import patterns:
  - Named: `import { useVuexStore } from 'mfe-components'` 
  - Default plugin: `import MfeComponents from 'mfe-components'; Vue.use(MfeComponents);`

Q: "Can my Vue 3 microfrontend use `useDerivedStore` even if I don't install `usePiniaStore` plugin?"
- A: You can call `useDerivedStore` directly to create a derived store from `window.globalStore`, but to ensure derived stores automatically get created for all modules (and global stores are set up), use `app.use(usePiniaStore(pinia))`.

Q: "How can I undo a bridge or remove a derived store?"
- A: Bridges return a disposal function. For `createPiniaStoreFromVuex`, the returned factory has `disposeBridge` attached (`useBridgedStore.disposeBridge`). For `registerBridges`, the function returns a disposer that will call all bridge disposers.

Q: "Do I need to use `window` in my code?"
- A: The library uses `window` to expose `window.store`, `window.globalStore` and `window.derivedStore` for convenience and for cross-MFE bridging. If you prefer a more encapsulated approach, you can wrap these calls inside your host and microfrontend adapters and avoid global refs in production - but out-of-box the code uses `window` to simplify mixing different frameworks.

---

## Troubleshooting Checklist

- Are `BRIDGE_REPLACE_STATE`/`BRIDGE_REPLACE_ROOT_STATE` mutations present and implemented safely?
- Are you using named exports properly? E.g., `import { useVuexStore } from 'mfe-components'`.
- If using `require()` check for `module.exports.default` or export wrappers.
- For Vue 3, make sure you call `app.use(usePiniaStore(pinia))` after you `app.use(pinia)` and after `window.globalStore` is set (or in the host that sets it).
- Confirm `window.globalStore` is the correct `Vuex` store instance.
- Use console logs to introspect imported values and types (e.g., `console.log(useVuexStore, typeof useVuexStore)`).
- Check for reactivity/performance issues with big root states or extremely frequent mutations (subscribe handlers run on every mutation).

---

## Considerations & Limitations

- This approach relies on the presence of `window` for the hosted and microfrontend integration. If your environment is server-side render or isolate contexts (no `window`), you must adapt the integration.
- Bridges do partial updates only; arrays are replaced in their entirety by design (not merged by index). This reduces ambiguity, but may not be suitable for scenarios requiring granular array diffs.
- `BRIDGE_REPLACE_*` must exist in Vuex; otherwise you may not be able to push Pinia changes back to Vuex.
- Frequent large updates could performance hit due to subscription and diff/patch cycles.
- Pinia/ Vuex versions & compatibility: this library assumes Vuex v3 / Vue 2 for the host and Pinia for the new microfrontends. If you use Pinia with Vue 2 you may need `@vue/composition-api` and `pinia` plugin targeting Vue 2.
- Tests: Complex edge cases require thorough tests - no unit/integration tests are shipped by default for the bridges.

---

## Migration Cheat-Sheet (Limited to state bridging)

Step-by-step migration strategy:

1. Keep your root Vuex store intact and fully functional.
2. Add `BRIDGE_REPLACE_ROOT_STATE` in the root store's mutations.
3. Add `BRIDGE_REPLACE_STATE` in the Vuex modules you want to migrate.
4. Update `host` to call `useVuexStore(Vue, globalStoreConfig)` so `window.store/globalStore` becomes available — do this early in host boot.
5. For each migrated MFE app (Vue 3 + Pinia):
   - Add `app.use(pinia)`.
   - Then `app.use(usePiniaStore(pinia))` to initialize derived stores and global bridge store.
   - Use `useDerivedStore(pinia, 'namespace')` inside components to get a Pinia-based store for the module.
6. You can run both Vuex and Pinia side-by-side and progressively move modules over. When fully migrated, you can remove `BRIDGE_REPLACE_*` since the bridging becomes unnecessary.

---

## Post-Migration: Cleanup & Host Changes (When all child apps migrated to Pinia)

Below is a checklist and technical guidance for the host/shell app once all microfrontends have migrated to Pinia and you want to decommission the bridge code and Vuex.

### Preconditions & Validation

- Confirm all microfrontends (and host consumers) have been updated to `Pinia` and no longer import `useDerivedStore` or expect `window.globalStore`.
- Search the codebase for references:
  - `useVuexStore`, `usePiniaStore`, `useDerivedStore`, `createPiniaStoreFromVuex`, `createGlobalPiniaStoreFromVuex`, and `BRIDGE_REPLACE_*`.
  - Ensure the code compiles and tests pass after these replacements.

### Host Strategy Overview

You have two main options when the host moves on from Vuex:

1. Migrate the host to Pinia (Recommended):
  - Host becomes Pinia-first and microfrontends use Pinia stores directly (no bridge required).
  - This is the simplest approach if the host will be upgraded to Vue 3 or supports Pinia on Vue 2.

2. Keep host as Vuex but remove bridge: less common but possible if the host must stay Vue 2 / Vuex for other reasons.
  - In this case, microfrontends should use Pinia; however, the host may still provide centralized mutators via APIs rather than rely on state sync.

### Step-by-step: Transition the Host to Pinia (Vue 3 host example)

1) Replace the Vuex root with a Pinia-root in the host app bootstrap (Vue 3 example):

```js
// main.js (host)
import { createApp } from 'vue';
import { createPinia } from 'pinia';
import App from './App.vue';

const app = createApp(App);
const pinia = createPinia();
app.use(pinia);

// If the host previously used `useVuexStore`, replace or remove that behavior
// and migrate any existing Vuex modules to Pinia stores
app.mount('#app');
```

2) Convert or recreate each Vuex module as a Pinia store:

```js
// stores/user.js (Pinia)
import { defineStore } from 'pinia';

export const useUserStore = defineStore('user', {
  state: () => ({ name: 'Alice', counter: 0 }),
  actions: {
   setName(name) { this.name = name; }
  }
});
```

3) Update host and microfrontends to import and use the Pinia stores instead of `window.globalStore`:

```js
// microfrontend code - previously: useDerivedStore(pinia, 'user')
// now import directly (if hosted and shared store is available):
import { useUserStore } from 'host-shared-stores';
const userStore = useUserStore();
```

4) Remove references to `window.store`/`window.globalStore` and bridging utilities from the host code and microfrontends.

5) Remove `BRIDGE_REPLACE_*` mutations from Vuex modules, if you deleted Vuex entirely.

6) Validate with tests and integration checks:
  - Unit tests: assert actions & mutations / actions on Pinia match expected behaviors
  - Integration tests: verify MFE and host apps share state or coordinate via the new store

7) Remove or update your published `mfe-components` package if it included bridging utilities not required anymore:
  - Consider a minor or major semver bump to reflect removal of bridging features.

### What to do if the host remains Vue 2 + Vuex

- Avoid removing `BRIDGE_REPLACE_*` until all host-specific code and other consumers are verified to be migrated.
- For host-only usage (no cross-app pinia expectations), continue to maintain the Vuex root; migrate host's internal modules to Pinia and gradually reduce reliance on `BRIDGE_REPLACE_*`.
- A longer-term strategy is to migrate the host to Vue 3 + Pinia, but it may not be possible in some cases.

### Post-migration QA Plan & Release

1. Run a compatibility test matrix across unaffected microfrontends and host features.
2. Run smoke tests to ensure there are no missing global variables or references to former bridging APIs.
3. Benchmark typical scenarios (e.g., updating lists or high-frequency mutations) to detect performance regressions.
4. Roll out the change in a feature flag or phased release if your environment supports progressive rollout.

### Rollback Plan

If a migration step causes issues, revert to a canary branch and restore the bridging utilities and Vuex root in the host. The code path is reversible by re-adding the `usePiniaStore` plugin and reintegrating the `createPiniaStoreFromVuex` calls until the fix is validated and re-deployed.

---

## Detailed Flow (Startup & Sync sequences)

### Startup Sequence (Host + MFE)
1. Host boots — install Vuex root and `useVuexStore(Vue, rootConfig)` (if host uses this helper). `window.globalStore` is set.
2. MFE loads — installs `Pinia` and calls `app.use(usePiniaStore(pinia))` which reads `window.globalStore` and wires derived stores.
3. Derived stores are created lazily — `createPiniaStoreFromVuex` returns a factory and attaches `disposeBridge` for later cleanup; the bridge is only created when `useStore()` is called (first use).

### Sync (Pinia → Vuex)
1. Pinia store mutates. The $subscribe emits with `mutation` and `payload`.
2. Bridge plugin checks `syncingFromVuex`. If not `true`, it sets `syncingFromPinia = true` and commits `BRIDGE_REPLACE_*` on the relevant Vuex store / module with `payload`.
3. Vuex mutation runs; `vuex.subscribe` captures the change and the bridge applies a diff/patch to the Pinia store if needed.
4. `syncingFromPinia` is reset. `Mutex` ensures race-free commits.

### Sync (Vuex → Pinia)
1. Vuex store commits a mutation (could be anything — commit or action). `vuex.subscribe` callback on the bridge calculates `diff` between the (Pinia) store state and the new Vuex state for that module.
2. If diff is non-empty, Pinia store is updated via `deepPatch`.
3. Flag `syncingFromVuex` prevents notifying Pinia -> Vuex sync when updating stores during this patch.

---

## Considerations for Removing Window Globals

- If you want to remove `window` globals: rewire the plugin API to accept explicit store references.
- Provide a `createBridgeManager({ app, pinia, vuexStore })` that returns bridge handles rather than using `window`.
- Document how the host will provide the `vuexStore` reference to microfrontends or central bridge manager via a module or explicit plugin API.

---

## Final checklist before decommissioning the bridge

 - All MFEs migrated to Pinia and don't import `useDerivedStore`.
 - No code references `window.globalStore` or `useVuexStore` in runtime code.
 - Unit and integration tests verified on staging.
 - No consumers rely on `BRIDGE_REPLACE_*` mutations; safe to remove.
 - Updated docs to describe the new interface for the host and MFEs.
 - Release and canary rollouts validated.


---

## Future Improvements & Enhancements

- Add typed, generated `.d.ts` files and publish them with the bundle so consumers get robust autocompletion.
- Add more sophisticated array merging strategy (if needed) or configurable merge strategies per namespace.
- Add programmatic APIs to choose the sync direction per namespace (one-way sync from Vuex->Pinia while test migrating), or a `mode` option (read-only pinia, read-only vuex, bidirectional).
- Remove `window` dependency and optionally register an `EventBus` or inject a `bridgeManager` object into your apps — this improves testability and SSR compatibility.
- Add telemetry and counters around mutation and patch size, and warnings for large diff patches.
- Add baked-in unit/integration tests for bridging behavior and component usage.
- Consider adding a compatibility layer for `pinia` to support Vue 2 (with the `@vue/composition-api`) or provide an adapter so apps can use the same API in both versions.

---

## Appendix: Quick Reference Code

`useVuexStore` (Vue 2):
```js
export const useVuexStore = (vue, globalStore) => {
  vue.use(new class VuexStorePlugin {
    install(Vue) {
      Vue.use(window.Vuex);
      const store = new window.Vuex.Store(globalStore);
      window.store = store; // legacy convenience / global
      window.globalStore = store;
    }
  });
};
```

`usePiniaStore` (Vue 3 plugin):
```js
export const usePiniaStore = (pinia) => (new class PiniaStorePlugin {
  install(app, options) {
    const bridgeStore = createGlobalPiniaStoreFromVuex(pinia, window.globalStore);
    const derivedStore = {};
    // find namespaces and create per-module store
    const namespaces = Object.keys(window.store._modulesNamespaceMap).map((ns) => ns.replace(/\/$/, ""));
    for (const namespace of namespaces) {
      const store = createPiniaStoreFromVuex(pinia, window.globalStore, namespace, options?.[namespace] || {});
      derivedStore[namespace] = store();
    }
    app.config.globalProperties.$bridgeStore = window.bridgeStore = bridgeStore();
    app.config.globalProperties.$derivedStore = window.derivedStore = derivedStore;
    app.provide('derivedStore', derivedStore);
  }
});
```

---

## Want help migrating?

If you want, I can prepare a concrete migration script for one of your modules — e.g., a step-by-step code sample that:

- Adds `BRIDGE_REPLACE_STATE` to Vuex `user` module,
- Exposes `user` module to a `useDerivedStore` in a sample Vue 3 microfrontend,
- Writes a test to confirm a mutation in the Pinia store is reflected in Vuex and vice-versa.

Just tell me which module you want to migrate first and whether the target microfrontend uses Vue 3 or Vue 2. I’ll create a small example and automated test harness for it.
