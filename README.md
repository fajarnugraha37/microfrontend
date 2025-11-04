# Vue 2 Microfrontend Demo (Qiankun)

This repository showcases a complete Vue 2 microfrontend setup built with Vue CLI, Webpack, and [Qiankun](https://qiankun.umijs.org/). It includes:

- `common`: shell application hosting microfrontends and shared state management.
- `app-dashboard`: dashboard microfrontend consuming shared state, utilities, and UI components.
- `app-profile`: profile microfrontend focused on user management and shell communication.
- `components`: shared Vue component library exported as a UMD bundle.

## Prerequisites

- Node.js 14+ (or any version supported by Vue CLI 4/5)
- npm 6+
- [@vue/cli](https://cli.vuejs.org/) globally installed (optional but recommended)

> All Vue applications are configured for Vue 2.6.x and Vue CLI 4.x.

## Setup Instructions

1. **Install and build the shared component library**
   ```bash
   cd components
   npm install
   npm run build
   cd ..
   ```

2. **Install dependencies for each application (components are linked via `file:../components`)**
   ```bash
   cd common && npm install && cd ..
   cd app-dashboard && npm install && cd ..
   cd app-profile && npm install && cd ..
   ```

3. **Run all projects (separate terminals recommended)**
   ```bash
   # Terminal 1 - shared library (optional during development)
   cd components
   npm run build -- --watch

   # Terminal 2 - shell application
   cd common
   npm run serve

   # Terminal 3 - dashboard microfrontend
   cd app-dashboard
   npm run serve -- --port 8081

   # Terminal 4 - profile microfrontend
   cd app-profile
   npm run serve -- --port 8082
   ```

4. **Visit the shell app**
   ```
   http://localhost:8080
   ```

   Navigate to **Dashboard** or **Profile** to see the respective microfrontends rendered inside the shell.

### Notes

- Each microfrontend exposes Qiankun lifecycle methods (`bootstrap`, `mount`, `unmount`) and supports local development (standalone mode) via Vue Router base configuration.
- Global Vuex state is synchronised across every app. The shell publishes its Vuex store through Qiankun’s `initGlobalState`, while each child updates a local `sharedShell` module and can push mutations back via `$microActions.pushSharedState(...)`.
- Shared UI components (`CButton`, `CInput`) are published by the `components` project and imported via local file dependency (`file:../components`).
- Shell state is persisted with `vuex-persistedstate`, demonstrating how authentication survives reloads.

## Project Structure

```
common/             # Shell app
app-dashboard/      # Dashboard microfrontend
app-profile/        # Profile microfrontend
components/         # Shared UI library
README.md
```

Each project contains the standard Vue CLI scaffold (`src`, `public`, `vue.config.js`, etc.) customised for the microfrontend architecture described above.
