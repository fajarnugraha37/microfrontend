import { createApp, h } from 'vue';
import App from './App.vue';
import createRouter from './router';
import createStore from './store';

let appInstance = null;
let routerInstance = null;
let storeInstance = null;
let isSyncingFromGlobal = false;
let offGlobalStateChange = null;

const teardownGlobalStateSync = () => {
  if (typeof offGlobalStateChange === 'function') {
    offGlobalStateChange();
    offGlobalStateChange = null;
  }
};

const setupGlobalStateSync = (props = {}) => {
  const { onGlobalStateChange, getGlobalState } = props;

  teardownGlobalStateSync();

  if (typeof onGlobalStateChange === 'function' && storeInstance) {
    offGlobalStateChange = onGlobalStateChange((state) => {
      if (state && state.shellStore) {
        const existing = storeInstance.getters.sharedShell || {};
        const incoming = state.shellStore;
        const isDifferent = JSON.stringify(existing) !== JSON.stringify(incoming);
        if (isDifferent) {
          isSyncingFromGlobal = true;
          storeInstance.commit('replaceSharedShell', incoming);
          isSyncingFromGlobal = false;
        }
      }
    }, true);
  }

  if (typeof getGlobalState === 'function' && storeInstance) {
    const current = getGlobalState();
    if (current && current.shellStore) {
      isSyncingFromGlobal = true;
      storeInstance.commit('replaceSharedShell', current.shellStore);
      isSyncingFromGlobal = false;
    }
  }
};

const createMicroApp = (router, store, props = {}) => {
  const {
    sharedUtils = {},
    onGlobalStateChange,
    setGlobalState,
    getGlobalState
  } = props;

  const app = createApp({
    render: () =>
      h(App, {
        sharedUtils,
        onGlobalStateChange,
        setGlobalState,
        getGlobalState
      })
  });

  app.config.compatConfig = {
    MODE: 2,
    GLOBAL_MOUNT: true,
    GLOBAL_EXTEND: true,
    GLOBAL_PROTOTYPE: true,
    INSTANCE_SCOPED_GLOBALS: true,
    ATTR_FALSE_VALUE: true,
     INSTANCE_LISTENERS: true,
    COMPONENT_V_MODEL: true,
    RENDER_FUNCTION: true
  };

  app.use(router);
  app.use(store);

  app.config.globalProperties.$sharedUtils = sharedUtils;
  app.config.globalProperties.$microActions = {
    onGlobalStateChange,
    setGlobalState,
    getGlobalState,
    pushSharedState(partial = {}) {
      const globalState = typeof getGlobalState === 'function' ? getGlobalState() : null;
      const baseState =
        (globalState && globalState.shellStore) || store.getters.sharedShell || {};
      const nextState = { ...baseState, ...partial };

      if (!isSyncingFromGlobal) {
        store.commit('replaceSharedShell', nextState);
      }

      if (typeof setGlobalState === 'function') {
        setGlobalState({
          shellStore: nextState
        });
      }
    }
  };

  return app;
};

const mountApp = async (props = {}) => {
  const container = props.container
    ? props.container.querySelector('#app')
    : document.querySelector('#app');

  if (!container) {
    throw new Error('[app-profile] mount container not found');
  }

  if (appInstance) {
    appInstance.unmount();
    appInstance = null;
  }

  routerInstance = createRouter();
  storeInstance = createStore();
  const app = createMicroApp(routerInstance, storeInstance, props);
  setupGlobalStateSync(props);

  app.mount(container);
  if (routerInstance && typeof routerInstance.isReady === 'function') {
    await routerInstance.isReady();
  }
  appInstance = app;
};

if (!window.__POWERED_BY_QIANKUN__) {
  mountApp();
}

export async function bootstrap() {
  console.info('[app-profile] bootstraped');
}

export async function mount(props) {
  await mountApp(props);
}

export async function unmount() {
  teardownGlobalStateSync();

  if (appInstance) {
    appInstance.unmount();
    appInstance = null;
  }

  routerInstance = null;
  storeInstance = null;
}
