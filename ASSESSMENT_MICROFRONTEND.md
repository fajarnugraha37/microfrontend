## Microfrontend Orchestrator Assessment

### Current State: single-spa + Mixed Bundles
- **Shell**: Vite-based Vue 2 app orchestrated by single-spa (`common/`).
- **Dashboard**: Vue CLI/Webpack build that emits a single UMD bundle (`js/app.js`, `css/app.css`) and exposes lifecycles on `window.app-dashboard-main`.
- **Profile**: Vite/Vue 3 (compat) micro app built as an ES module and imported via an import map.
- **Communication**: Shell still shares utilities, global state, and the Vuex bridge through single-spa custom props (no Qiankun dependency).
- **Eval Footprint**: Removed. Assets are loaded via `<script>`/`<link>` tags or native `import()` without relying on `new Function`.

### Alternative Options

1. **Webpack Module Federation**
   - **How it works**: Shell and children ship as federated builds; the shell `import()`s remote modules at runtime.
   - **Pros**: Native ES module loading (no eval); first-class Webpack support; handles shared dependencies/version negotiation.
   - **Cons**: Requires all MFEs to align on compatible Module Federation configs. Vite support exists via plugins but adds complexity. Needs custom global state strategy (events, shared packages).
   - **Migration Fit**: High if we standardize on modern Webpack or Vite + MF; keep existing Vue apps with minor bootstrap rewrites.

2. **single-spa with Native ES Modules**
   - **How it works**: single-spa still orchestrates lifecycles, but each micro app builds to actual ESM bundles served directly with `type="module"`.
   - **Pros**: Mature ecosystem, no eval when using native modules; framework-agnostic.
   - **Cons**: No built-in sandboxing; must manage shared dependencies and CSS isolation manually. Requires build tweaks for ESM outputs.
   - **Migration Fit**: Medium; preserves Qiankun-style lifecycle code, but we need to ensure each build outputs pure ESM and design our own state/events bridge.

3. **SystemJS + Import Maps (no sandboxing)**
   - **How it works**: Host registers each micro app via import maps; the shell performs `import()` calls.
   - **Pros**: Simple loading story, no eval if we stick to native modules; dynamic version routing via import map updates.
   - **Cons**: No sandboxing; manual lifecycle/state coordination; requires browsers with import map support (polyfills for legacy).
   - **Migration Fit**: Medium-low; suits smaller teams comfortable with DIY orchestration.

4. **Wujie**
   - **How it works**: Alternative sandboxing framework (also from Ant Financial ecosystem) built to avoid `eval`.
   - **Pros**: Similar feature set to Qiankun (isolation, lifecycle), but implemented via iframe + proxy hybrids without eval usage.
   - **Cons**: Smaller community; documentation primarily in Chinese; integration stories with Vue 3 still emerging.
   - **Migration Fit**: Medium; could preserve current architecture with different runtime, but requires evaluation and translation efforts.

5. **Web Components / Custom Elements**
   - **How it works**: Each MFE ships as a custom element (possibly built from Vue via wrappers), hosted by the shell declaratively.
   - **Pros**: Native browser isolation, no orchestrator runtime; trivial loading via `<script type="module">`.
  - **Cons**: Lifecycle/state coordination must be built; extra work to wrap existing apps; CSS scoping via Shadow DOM can complicate styling.
   - **Migration Fit**: Low-medium; good for greenfield components but heavier for retrofitting existing SPAs.

6. **Iframes**
   - **How it works**: Each micro app loads in an iframe; shell communicates via `postMessage`.
   - **Pros**: Strong isolation; no eval concerns; easiest to reason about security.
   - **Cons**: Heavier resource cost; URL syncing/routing is complex; limited CSS/layout integration.
   - **Migration Fit**: Low unless security isolation trumps UX needs.

### Current Concerns / Follow-ups
- Dev UX asymmetry: dashboard must run `vue-cli-service serve` while the shell/profile use Vite; consider docs/scripts to simplify.
- Vue CLI output currently hard-codes `js/app.js` / `css/app.css`; set up an automated copy/upload step and environment overrides (`window.__APP_DASHBOARD_ASSETS__`) when filenames are hashed in prod.
- No sandboxing layer; rely on code review/testing to prevent global collisions (classes, styles). Consider CSS prefixes or micro-app-specific root elements.
- Shared state bus is now an in-memory event emitter (`common/src/state.js`). Validate behaviour across multiple mounts/unmounts and long-lived listeners.
- Evaluate replacing the dashboard's UMD bundle with an ES module build via Vue CLI 5 (`experiments.outputModule = true`) once we can upgrade the toolchain.
- Track remaining `window.*` shims (e.g., `window.appStoreBridge`, `window.sharedUtils`) and migrate consumers to module or prop-based access so the globals can be retired.
