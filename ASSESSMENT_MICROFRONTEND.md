## Microfrontend Orchestrator Assessment

### Current State: Qiankun
- **Strengths**
  - Provides lifecycle management (`bootstrap`, `mount`, `unmount`) and global state helpers out of the box.
  - Automatic sandboxing (proxy-based) keeps child globals isolated.
  - Easy to adopt for Vue 2 MFEs, works with our existing Vue Router/Vuex setup.
- **Weaknesses**
  - Relies on `new Function` / `eval` for asset execution; violates CSP policies forbidding script eval.
  - Limited tooling ecosystem for Vue 3 + Vite builds (bridges exist but add friction).
  - Debugging sandboxed globals and patched DOM APIs can be tricky.

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

### Recommendation
**Module Federation** is the most practical replacement if we want to stay bundle-driven and avoid eval: it keeps the shell in charge, leverages modern tooling, and only requires adapting our micro app bootstrap to expose remote modules. We’d pair it with:
- A shared shell store package (possibly the existing bridge published as a local npm module).
- A host-side router that lazy-loads remotes via dynamic `import()`.
- Shared dependency config to avoid duplicate Vue/Vuex copies.

If Module Federation adoption proves too heavy, **single-spa + native ESM** is the next clean option: similar lifecycle semantics, zero eval, but more DIY for shared state/sandboxing.

We should schedule a spike to convert one micro app (e.g., `app-dashboard`) to a Module Federation remote, validate loading from the shell without Qiankun, and measure integration effort before committing to a full migration plan.
