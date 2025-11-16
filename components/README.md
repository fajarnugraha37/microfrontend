# mfe-components — Microfrontend Component Library

This repository contains a small set of UI components and helper utilities designed to support a microfrontend architecture and partial migrations from Vue 2 (Vuex) → Vue 3 (Pinia).

Contents
- `src/` — Source files for UI components (`CButton`, `CInput`) and utility modules.
- `src/stores/` — Store bridge utilities to help migrate Vuex modules to Pinia and keep state in sync between hosts and microfrontends.
- `docs/` — Documentation and migration guides.

Key docs:
- [Stores: Vuex ↔ Pinia Bridge Architecture & Migration Guide](./docs/stores-wiki.md)

Usage
For quick start and examples, see the `docs/stores-wiki.md` page above for how to install the helpers, expose the Vuex host `globalStore`, and how to use derived Pinia stores inside microfrontends.

Feedback & Contribution
- For change requests, file a PR or issue in this repository.
- If you are working on a migration, consider opening a migration tracking issue per module to coordinate changes across teams.
