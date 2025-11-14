# Bridge Harness (local demo)

This small demo uses Vite to host a minimal Vue 3 + Pinia microapp that connects to a simulated Vuex 4 host store (used for compatibility with Vue 3) to demonstrate the bridge.

Quick start:

1. Open a terminal in `common/bridge/Raptor-Mini/harness`.
2. Install dependencies (pnpm or npm/yarn):

```bash
pnpm install
# or
npm install
```

3. Run the dev server:

```bash
pnpm dev
# or
npm run dev
```

4. Open http://localhost:5173 (Vite default) and interact with the host panel and microapp panel to see updates in both directions.

Files of interest:
- `src/host-store.js` - creates a Vuex 3 store simulating the shell host.
- `src/main.js` - configures the bridge to use `window.Vuex` and mounts the microapp.
- `ExampleBridgeComponent.vue` - shows reading/writing via the Pinia ↔ Vuex bridge.

Note: this demo uses a built-in Vuex 3 store for convenience; in a real qiankun environment the host would provide the store via either `window.Vuex` or `props.globalStore`.
