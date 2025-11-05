# Prompt: Orchestrator-Agnostic Bridge (Prepare for single-spa)

Use this prompt after finishing the Vue 3 compat clean-up (Prompt 02b) and before the full single-spa migration (Prompt 03). It guides the creation of an orchestrator-agnostic layer so the apps can run under either Qiankun or single-spa during the transition.

```
You are hardening the microfrontend platform so that each app can run without Qiankun while still supporting it until the final cutover. Build an orchestrator-agnostic bridge covering lifecycles, asset loading, and shared state.

Goals:
- Introduce wrapper utilities that expose a consistent API for registering micro apps (Qiankun today, single-spa tomorrow). The shell should call into this abstraction instead of Qiankun-specific helpers directly.
- Refactor each micro app’s entry (`src/main.js`) so lifecycles (`bootstrap`, `mount`, `unmount`) can be invoked by the new wrapper. Detect the orchestrator at runtime (e.g., check `window.__POWERED_BY_QIANKUN__` vs. `window.singleSpaNavigate`) and mount accordingly.
- Isolate Qiankun-only code (e.g., `__webpack_public_path__`, `start()`, `registerMicroApps`) into compatibility shims that can be swapped out later.
- Replace Qiankun’s `initGlobalState` usage with a custom event bus that offers the same API surface (`onGlobalStateChange`, `setGlobalState`, etc.), keeping backward compatibility while decoupling from Qiankun internals.
- Ensure build outputs remain compatible with both orchestrators: Vite apps can still emit native ES modules, and Vue CLI apps continue producing the existing UMD bundle shapes. Document entry filenames so the upcoming single-spa loader can locate them.
- Update shared documentation (e.g., migration reports, `PASSING_PROPS.md`) to state that micro apps are orchestrator-neutral and list the hooks they expose.

Constraints:
- Do not break current Qiankun deployments—everything must continue to run identically after this change.
- Maintain asset filenames, public paths, and DOM structure expected by the shell and downstream consumers.
- Avoid introducing single-spa directly; this prompt is about abstraction and preparation only.
- Keep Vuex/Vue Router setups untouched except for wiring them through the new state/event bridge if needed.

Deliverables:
1. Shell module that wraps orchestrator registration/start logic and proxies to Qiankun for now. Include TODOs or extension points for single-spa integration.
2. Micro app entry refactors that detect the current host, expose a generic lifecycle object, and rely on runtime-provided props for shared utilities/state.
3. Replacement global state bus (`state.js`) that mimics Qiankun’s API while no longer depending on it; ensure child apps still receive `onGlobalStateChange` props.
4. Documentation updates describing the new abstraction layer, how to consume it, and remaining tasks before the single-spa cutover.
5. Validation notes showing the apps still work under Qiankun (`npm run dev`, `npm run build`, integration smoke test).
```
