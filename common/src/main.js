import Vue from 'vue';
import App from './App.vue';
import router from './router';
import store from './store';
import { addGlobalUncaughtErrorHandler, loadMicroApp, start } from 'qiankun';
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

const getEnvProfileModule = () => {
  if (window.__APP_PROFILE_URL__) {
    return window.__APP_PROFILE_URL__;
  }
  if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_PROFILE_URL) {
    return import.meta.env.VITE_PROFILE_URL;
  }
  return 'app-profile';
};

const getProfileAssetFallback = () => {
  const base =
    window.__APP_PROFILE_BASE_URL__ ||
    (typeof import.meta !== 'undefined' && import.meta.env
      ? import.meta.env.VITE_PROFILE_BASE_URL
      : undefined);

  if (!base) {
    return null;
  }

  const normalized = base.replace(/\/$/, '');
  return {
    scripts: [`${normalized}/single-spa-entry.js`],
    styles: [`${normalized}/css/app.css`]
  };
};

const toArray = (value) => {
  if (!value) {
    return [];
  }
  return Array.isArray(value) ? value.filter(Boolean) : [value];
};

const normalizeEntry = (candidate) => {
  if (!candidate) {
    return null;
  }

  if (typeof candidate === 'string') {
    return candidate;
  }

  if (typeof candidate === 'object') {
    const entryValue = {};

    if (typeof candidate.html === 'string') {
      entryValue.html = candidate.html;
    }

    if ('scripts' in candidate || 'styles' in candidate) {
      const scripts = toArray(candidate.scripts);
      const styles = toArray(candidate.styles);

      if (scripts.length) {
        entryValue.scripts = scripts;
      }
      if (styles.length) {
        entryValue.styles = styles;
      }
    }

    if (Object.keys(entryValue).length > 0) {
      return entryValue;
    }

    return null;
  }

  return null;
};

const ensureEntryArrays = (entry) => {
  if (!entry || typeof entry !== 'object') {
    return entry;
  }

  const nextEntry = { ...entry };

  if ('scripts' in nextEntry && !Array.isArray(nextEntry.scripts)) {
    nextEntry.scripts = toArray(nextEntry.scripts);
  }

  if ('styles' in nextEntry && !Array.isArray(nextEntry.styles)) {
    nextEntry.styles = toArray(nextEntry.styles);
  }

  return nextEntry;
};

const createModuleHtmlEntry = ({ specifier, styles = [], globalVar, appName }) => {
  if (!specifier) {
    return null;
  }

  const targetGlobal = globalVar || appName || 'microApp';
  const styleTags = styles
    .map((href) => {
      if (typeof href === 'string') {
        return href;
      }
      if (href && typeof href === 'object' && typeof href.href === 'string') {
        return href.href;
      }
      return null;
    })
    .filter(Boolean)
    .map((href) => `<link rel="stylesheet" href="${href}"/>`)
    .join('');

  const moduleScript = `
    <script type="module">
      (async () => {
        try {
          const lifecycleModule = await import(${JSON.stringify(specifier)});
          window[${JSON.stringify(targetGlobal)}] = lifecycleModule;
        } catch (error) {
          console.error('[qiankun] failed to load ${targetGlobal}', error);
          throw error;
        }
      })();
    </script>
  `;

  return {
    html: `<!DOCTYPE html><html><head>${styleTags}${moduleScript}</head><body></body></html>`,
    scripts: [],
    styles: []
  };
};

const microApps = [
  {
    name: 'app-dashboard',
    resolveEntry: () =>
      normalizeEntry(
        window.__APP_DASHBOARD_ENTRY__ || window.__APP_DASHBOARD_ASSETS__ || dashboardAssets
      ),
    matches: (path = '') => path.startsWith('/dashboard')
  },
  {
    name: 'app-profile',
    resolveEntry: () => {
      const directEntry = normalizeEntry(window.__APP_PROFILE_ENTRY__);
      if (directEntry) {
        return directEntry;
      }

      const assetEntry = normalizeEntry(
        window.__APP_PROFILE_ASSETS__ || getProfileAssetFallback()
      );
      if (assetEntry) {
        return assetEntry;
      }

      return createModuleHtmlEntry({
        specifier: getEnvProfileModule(),
        styles: toArray(window.__APP_PROFILE_STYLES__),
        appName: 'app-profile'
      });
    },
    matches: (path = '') => path.startsWith('/profile')
  }
];

const microContainer = () => document.querySelector('#micro-app-container');

const createCustomProps = (container) => ({
  container: container || microContainer(),
  domElementGetter: () => container || microContainer(),
  sharedUtils: { ...sharedUtils },
  storeBridge,
  onGlobalStateChange: globalActions.onGlobalStateChange,
  setGlobalState: globalActions.setGlobalState,
  offGlobalStateChange: globalActions.offGlobalStateChange,
  getGlobalState: globalActions.getGlobalState
});

const resolveMicroAppForRoute = (route) => {
  if (!route) {
    return null;
  }

  const path = route.path || route.fullPath || '';
  return microApps.find((microApp) => microApp.matches(path)) || null;
};

const clearMicroContainer = () => {
  const container = microContainer();
  if (container) {
    container.innerHTML = '';
  }
};

let activeParcel = null;
let activeMicroAppName = null;
let navigationSequence = 0;

const unloadActiveMicroApp = async (sequenceToken) => {
  if (!activeParcel) {
    activeMicroAppName = null;
    clearMicroContainer();
    return;
  }

  try {
    await activeParcel.unmount();
  } catch (error) {
    if (process.env.NODE_ENV !== 'production') {
      // eslint-disable-next-line no-console
      console.error('[qiankun] failed to unmount active micro app', error);
    }
  }

  if (typeof activeParcel.unload === 'function') {
    try {
      await activeParcel.unload();
    } catch (error) {
      if (process.env.NODE_ENV !== 'production') {
        // eslint-disable-next-line no-console
        console.warn('[qiankun] failed to unload micro app assets', error);
      }
    }
  }

  if (sequenceToken === navigationSequence) {
    activeParcel = null;
    activeMicroAppName = null;
    clearMicroContainer();
  }
};

const mountMicroApp = async (config, sequenceToken, route) => {
  const container = microContainer();
  if (!container) {
    if (process.env.NODE_ENV !== 'production') {
      // eslint-disable-next-line no-console
      console.warn('[qiankun] micro app container not found');
    }
    return;
  }

  const entry = typeof config.resolveEntry === 'function' ? config.resolveEntry() : config.entry;

  const normalizedEntry = ensureEntryArrays(normalizeEntry(entry));
  if (!normalizedEntry) {
    if (process.env.NODE_ENV !== 'production') {
      // eslint-disable-next-line no-console
      console.warn(`[qiankun] entry not defined for ${config.name}, skip mounting`);
    }
    return;
  }

  if (process.env.NODE_ENV !== 'production') {
    // eslint-disable-next-line no-console
    console.debug('[qiankun] loading micro app', config.name, normalizedEntry);
  }

  const parcel = loadMicroApp(
    {
      name: config.name,
      entry: normalizedEntry,
      container,
      props: {
        ...createCustomProps(container),
        route
      }
    },
    {
      sandbox: { strictStyleIsolation: false },
      prefetch: true,
      singular: false
    }
  );

  activeParcel = parcel;
  activeMicroAppName = config.name;

  try {
    await parcel.mountPromise;
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error(`[qiankun] failed to mount ${config.name}`, error);
    if (sequenceToken === navigationSequence) {
      await unloadActiveMicroApp(sequenceToken);
    }
  }
};

const syncMicroAppWithRoute = async (route) => {
  const sequenceToken = ++navigationSequence;
  const targetConfig = resolveMicroAppForRoute(route);

  if (!targetConfig) {
    await unloadActiveMicroApp(sequenceToken);
    return;
  }

  if (activeMicroAppName === targetConfig.name) {
    return;
  }

  await unloadActiveMicroApp(sequenceToken);

  if (sequenceToken !== navigationSequence) {
    return;
  }

  await mountMicroApp(targetConfig, sequenceToken, route);
};

router.afterEach((to) => {
  syncMicroAppWithRoute(to).catch((error) => {
    if (process.env.NODE_ENV !== 'production') {
      // eslint-disable-next-line no-console
      console.error('[qiankun] failed to sync micro app after navigation', error);
    }
  });
});

router.onReady(() => {
  syncMicroAppWithRoute(router.currentRoute).catch((error) => {
    if (process.env.NODE_ENV !== 'production') {
      // eslint-disable-next-line no-console
      console.error('[qiankun] failed to load initial micro app', error);
    }
  });
});

addGlobalUncaughtErrorHandler((event) => {
  // eslint-disable-next-line no-console
  console.error('[qiankun] micro app error', event?.message || event);
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
