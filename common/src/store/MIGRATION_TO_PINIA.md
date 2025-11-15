# Migration guide: Vuex → Pinia Bridge (runtime)

This short guide explains how to use the runtime bridge so child microfrontends can use Pinia, while the single canonical Vuex store remains the host-level source of truth.

Key steps

1. Ensure the shell registers the global store on `window.globalStore`, or passes it through qiankun `props.globalStore` during `registerMicroApps`.

2. In the microfrontend (Vue 3 + Pinia):

- Create Pinia and `app.use(pinia)` and configure the bridge with `configureVuexBridge`:

```js
import { configureVuexBridge } from 'common/bridge/Raptor-Mini/vuexBridgeConfig'
import { createPinia } from 'pinia'
import { createApp } from 'vue'

const pinia = createPinia()
const app = createApp(App)
app.use(pinia)

// call configureVuexBridge inside mount(props) and prefer props.globalStore
configureVuexBridge({ getGlobalStore: () => (props && props.globalStore) || window.globalStore || window.Vuex || null })
```

- Use the helper to create bridged Pinia store factories only for the modules you need:

```js
import { createPiniaBridgeStores } from 'common/src/store'

const factories = createPiniaBridgeStores(pinia, { modules: ['auth', 'product'] })
const useAuth = factories['auth/']
const authStore = useAuth() // call inside your `setup()`
```

3. Read and write on the Pinia facade

- Read and consume signals as reactive refs (use `.value` in JS, templates auto-unwrap):

```js
const auth = useAuth()
const token = computed(() => auth.token.value)
```

- Update the state through the Vuex store by calling `commitLocal`/`dispatchLocal`:

```js
auth.commitLocal('setToken', 'abc') // invokes Vuex mutation `auth/setToken`
auth.dispatchLocal('refreshToken') // calls `auth/refreshToken`
```

Why this approach

- Vuex remains the canonical backend state & logic provider. Pinia in per-microapp remains a safe façade for UI components.
- The bridge keeps discoveries minimal: it subscribes to Vuex mutations and patches the Pinia facade so a migrating microfrontend keeps working without having to rewrite domain logic.
- Microfrontends can gradually migrate module implementations to Pinia (once fully migrated, they become authoritative and the shell's module may be removed).

Tradeoffs

- This design mirrors the Vuex module state into Pinia (avoids shared reactivity across frameworks). As a result, frequent updates can cause extra patching.
- Be careful about module duplication and naming. To avoid conflicting state names, map module state into namespaced properties or move to `mapState` to avoid unnecessary re-renders.

Advanced

- You can use `registerAllVuexModulesAsPinia()` to inspect the Vuex store and auto-create bridged Pinia factories; remember this relies on Vuex internals (private API). Use this with caution.
- The bridge supports a special `<root>` namespace mapping for bridging the root state (i.e., `createVuexModulePiniaStore({ namespace: '<root>' })`).

Limitations

- This bridge does not create a global single reactive object shared by Vue 2 host (Vuex) and Vue 3 microapps (Pinia). It's a robust runtime mapping that keeps Pinia in sync with Vuex.

If you want, I can also:
- Convert an existing microfrontend (e.g., `app-profile`) to use the bridge fully using `createPiniaBridgeStores`, or
- Add a sample to the harness showing how `createPiniaBridgeStores` supports the entire store including `<root>`.
