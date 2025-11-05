import Vue from 'vue';
import App from './App.vue';
import router from './router';
import store from './store';
import { registerApplication, addErrorHandler, start } from 'single-spa';
import globalActions from './state';
import * as sharedUtils from './utils';
import createStoreBridge from './store/bridge';

Vue.config.productionTip = false;

let app = null;

function render() {
  app = new Vue({
    router,
    store,
    render: (h) => h(App)
  }).$mount('#app');
}

render();

let isSyncingFromGlobal = false;
let serializedShellStore = JSON.stringify(store.state);
const storeBridge = createStoreBridge(store);

globalActions.setShellStore(store.state);

globalActions.onGlobalStateChange((state) => {
  if (state && state.shellStore) {
    const incoming = JSON.stringify(state.shellStore);
    if (incoming !== serializedShellStore) {
      isSyncingFromGlobal = true;
      store.replaceState({
        ...store.state,
        ...state.shellStore
      });
      serializedShellStore = incoming;
      isSyncingFromGlobal = false;
    }
  }
});

store.subscribe((mutation, state) => {
  if (isSyncingFromGlobal) {
    return;
  }

  const nextSerialized = JSON.stringify(state);
  if (nextSerialized !== serializedShellStore) {
    serializedShellStore = nextSerialized;
    globalActions.setShellStore(state);
  }
});

const loadedScripts = new Map();
const loadedStyles = new Map();

const loadScript = (url) => {
  if (!url) {
    return Promise.resolve();
  }

  if (loadedScripts.has(url)) {
    return loadedScripts.get(url);
  }

  const promise = new Promise((resolve, reject) => {
    if (document.querySelector(`script[src="${url}"]`)) {
      resolve();
      return;
    }

    const script = document.createElement('script');
    script.src = url;
    script.onload = () => resolve();
    script.onerror = (event) => reject(event?.error || new Error(`Failed to load script ${url}`));
    document.head.appendChild(script);
  });

  loadedScripts.set(url, promise);
  return promise;
};

const loadStyle = (url) => {
  if (!url) {
    return Promise.resolve();
  }

  if (loadedStyles.has(url)) {
    return loadedStyles.get(url);
  }

  const promise = new Promise((resolve, reject) => {
    if (document.querySelector(`link[href="${url}"]`)) {
      resolve();
      return;
    }

    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = url;
    link.onload = () => resolve();
    link.onerror = () => reject(new Error(`Failed to load stylesheet ${url}`));
    document.head.appendChild(link);
  });

  loadedStyles.set(url, promise);
  return promise;
};

const loadUmdMicroApp = async (assets) => {
  if (!assets) {
    return;
  }

  const { styles = [], scripts = [] } = assets;
  await Promise.all(styles.map((styleUrl) => loadStyle(styleUrl)));

  for (const scriptUrl of scripts) {
    // eslint-disable-next-line no-await-in-loop
    await loadScript(scriptUrl);
  }
};

const envDashboardUrl =
  typeof import.meta !== 'undefined' && import.meta.env
    ? import.meta.env.VITE_DASHBOARD_URL
    : undefined;

const DASHBOARD_BASE_URL =
  window.__APP_DASHBOARD_BASE_URL__ || envDashboardUrl || 'http://localhost:8081';

const dashboardAssets =
  window.__APP_DASHBOARD_ASSETS__ ||
  (() => ({
    styles: [`${DASHBOARD_BASE_URL}/css/app.css`],
    scripts: [`${DASHBOARD_BASE_URL}/js/app.js`]
  }))();

const microApps = [
  {
    name: 'app-dashboard',
    loader: async () => {
      await loadUmdMicroApp(dashboardAssets);
      const lifecycles =
        window['app-dashboard-app'] ||
        window['app-dashboard-main'] ||
        window['app-dashboard'];
      if (!lifecycles) {
        throw new Error('[single-spa] app-dashboard lifecycles not found on window');
      }
      return lifecycles;
    },
    activeWhen: (location) => location.pathname.startsWith('/dashboard')
  },
  {
    name: 'app-profile',
    loader: () => {
      const profileUrl =
        window.__APP_PROFILE_URL__ ||
        (typeof import.meta !== 'undefined' && import.meta.env
          ? import.meta.env.VITE_PROFILE_URL
          : undefined);

      if (profileUrl) {
        return import(/* @vite-ignore */ profileUrl);
      }

      return import(/* @vite-ignore */ `${'app-profile'}`);
    },
    activeWhen: (location) => location.pathname.startsWith('/profile')
  }
];

const microContainer = () => document.querySelector('#micro-app-container');

const createCustomProps = () => ({
  container: microContainer(),
  domElementGetter: microContainer,
  sharedUtils: { ...sharedUtils },
  storeBridge,
  onGlobalStateChange: globalActions.onGlobalStateChange,
  setGlobalState: globalActions.setGlobalState,
  offGlobalStateChange: globalActions.offGlobalStateChange,
  getGlobalState: globalActions.getGlobalState
});

microApps.forEach((appConfig) => {
  registerApplication({
    name: appConfig.name,
    app: appConfig.loader,
    activeWhen: appConfig.activeWhen,
    customProps: () => ({
      ...createCustomProps()
    })
  });
});

addErrorHandler((error) => {
  // eslint-disable-next-line no-console
  console.error('[single-spa] micro app error', error);
});

Vue.nextTick(() => {
  if (!window.singleSpaStarted) {
    start({
      urlRerouteOnly: true
    });
    window.singleSpaStarted = true;
  }
});

export default app;
