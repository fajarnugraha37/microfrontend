import { createApp, h } from 'vue';
import App from './App.vue';
import createRouter from './router';
import createStore from './store';

let appInstance = null;
let routerInstance = null;
let storeInstance = null;
let isSyncingFromGlobal = false;
let offGlobalStateChange = null;
let teardownShellStoreBridge = null;
let shellStoreFacade = null;
let bridgeAppInstance = null;
let mountPoint = null;

const noop = () => {};

const snapshotsEqual = (a, b) => {
  if (a === b) {
    return true;
  }

  try {
    return JSON.stringify(a) === JSON.stringify(b);
  } catch (error) {
    return false;
  }
};

const teardownRemoteShellBridge = () => {
  if (typeof teardownShellStoreBridge === 'function') {
    teardownShellStoreBridge();
    teardownShellStoreBridge = null;
  }

  if (
    bridgeAppInstance &&
    bridgeAppInstance.config &&
    bridgeAppInstance.config.globalProperties &&
    bridgeAppInstance.config.globalProperties.$shellStore === shellStoreFacade
  ) {
    delete bridgeAppInstance.config.globalProperties.$shellStore;
  }

  bridgeAppInstance = null;
  shellStoreFacade = null;
};

const createShellStoreFacade = (bridge) => {
  if (!bridge || typeof bridge !== 'object') {
    return null;
  }

  return {
    get state() {
      if ('state' in bridge) {
        return bridge.state;
      }
      return typeof bridge.getState === 'function' ? bridge.getState() : {};
    },
    get getters() {
      return bridge.getters || {};
    },
    getState: () => (typeof bridge.getState === 'function' ? bridge.getState() : {}),
    commit: (type, payload, options) => {
      if (typeof bridge.commit === 'function') {
        return bridge.commit(type, payload, options);
      }
      return undefined;
    },
    dispatch: (type, payload) => {
      if (typeof bridge.dispatch === 'function') {
        return bridge.dispatch(type, payload);
      }
      return Promise.resolve();
    },
    subscribe: (listener) => {
      if (typeof bridge.subscribe === 'function') {
        return bridge.subscribe(listener);
      }
      return noop;
    },
    watch: (getter, callback, options) => {
      if (typeof bridge.watch === 'function') {
        return bridge.watch(getter, callback, options);
      }
      return noop;
    },
    replaceState: (next) => {
      if (typeof bridge.replaceState === 'function') {
        return bridge.replaceState(next);
      }
      return undefined;
    },
    registerModule: (path, module, options) => {
      if (typeof bridge.registerModule === 'function') {
        return bridge.registerModule(path, module, options);
      }
      return undefined;
    },
    unregisterModule: (path) => {
      if (typeof bridge.unregisterModule === 'function') {
        return bridge.unregisterModule(path);
      }
      return undefined;
    },
    hasModule: (path) => {
      if (typeof bridge.hasModule === 'function') {
        return bridge.hasModule(path);
      }
      return false;
    }
  };
};

const setupShellStoreBridge = (app, store, bridge) => {
  teardownRemoteShellBridge();

  if (!bridge || typeof bridge !== 'object' || !store) {
    return null;
  }

  const facade = createShellStoreFacade(bridge);
  shellStoreFacade = facade;
  bridgeAppInstance = app;

  if (app && app.config && app.config.globalProperties) {
    app.config.globalProperties.$shellStore = facade;
  }

  const syncSnapshot = (snapshot) => {
    if (!snapshot || !store) {
      return;
    }

    const current = store.getters.sharedShell || {};
    if (!snapshotsEqual(current, snapshot)) {
      isSyncingFromGlobal = true;
      store.commit('replaceSharedShell', snapshot);
      isSyncingFromGlobal = false;
    }
  };

  if (typeof bridge.getState === 'function') {
    syncSnapshot(bridge.getState());
  }

  let unsubscribe = null;
  if (typeof bridge.subscribe === 'function') {
    unsubscribe = bridge.subscribe((_mutation, state) => {
      syncSnapshot(state);
    });
  }

  teardownShellStoreBridge = () => {
    if (typeof unsubscribe === 'function') {
      unsubscribe();
    }
    if (
      app &&
      app.config &&
      app.config.globalProperties &&
      app.config.globalProperties.$shellStore === facade
    ) {
      delete app.config.globalProperties.$shellStore;
    }
    if (shellStoreFacade === facade) {
      shellStoreFacade = null;
    }
    if (bridgeAppInstance === app) {
      bridgeAppInstance = null;
    }
  };

  return facade;
};

const teardownGlobalStateSync = () => {
  if (typeof offGlobalStateChange === 'function') {
    offGlobalStateChange();
    offGlobalStateChange = null;
  }
};

const setupGlobalStateSync = (props = {}) => {
  const { onGlobalStateChange, getGlobalState, storeBridge } = props;

  teardownGlobalStateSync();

  if (storeBridge && typeof storeBridge.subscribe === 'function') {
    return;
  }

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
    getGlobalState,
    storeBridge
  } = props;

  let shellBridgeFacade = null;

  const resolveContainer = () => {
    if (props.container instanceof Element) {
      return props.container;
    }
    if (typeof props.domElementGetter === 'function') {
      const element = props.domElementGetter();
      if (element instanceof Element) {
        return element;
      }
    }
    return document.querySelector('#micro-app-container');
  };

  const ensureMountPoint = () => {
    const containerElement = resolveContainer();
    if (!containerElement) {
      return null;
    }

    let target = containerElement.querySelector('.app-profile-root');
    if (!target) {
      target = document.createElement('div');
      target.className = 'app-profile-root';
      containerElement.innerHTML = '';
      containerElement.appendChild(target);
    }
    mountPoint = target;
    return target;
  };

  const app = createApp({
    render: () =>
      h(App, {
        sharedUtils,
        onGlobalStateChange,
        setGlobalState,
        getGlobalState,
          shellStore: shellBridgeFacade
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
  const resolveShellStore = () =>
    shellBridgeFacade || storeBridge || app.config.globalProperties.$shellStore || null;
  app.config.globalProperties.$microActions = {
    onGlobalStateChange,
    setGlobalState,
    getGlobalState,
    commitToShell(type, payload, options) {
      const bridge = resolveShellStore();
      if (bridge && typeof bridge.commit === 'function') {
        return bridge.commit(type, payload, options);
      }
      return undefined;
    },
    dispatchToShell(type, payload) {
      const bridge = resolveShellStore();
      if (bridge && typeof bridge.dispatch === 'function') {
        return bridge.dispatch(type, payload);
      }
      return Promise.resolve();
    },
    pushSharedState(partial = {}) {
      const globalState = typeof getGlobalState === 'function' ? getGlobalState() : null;
      const baseState =
        (globalState && globalState.shellStore) || store.getters.sharedShell || {};
      const nextState = { ...baseState, ...partial };

      if (!isSyncingFromGlobal) {
        store.commit('replaceSharedShell', nextState);
      }

      const bridge = resolveShellStore();
      if (bridge && typeof bridge.replaceState === 'function') {
        bridge.replaceState(nextState);
      }

      if (typeof setGlobalState === 'function') {
        setGlobalState({
          shellStore: nextState
        });
      }
    }
  };

  shellBridgeFacade = setupShellStoreBridge(app, store, storeBridge);

  return app;
};

const mountApp = async (props = {}) => {
  const container = props.container || (typeof props.domElementGetter === 'function'
    ? props.domElementGetter()
    : null);
  const qiankunContainer = props.container && props.container.querySelector
    ? props.container.querySelector('#app')
    : null;
  let mountTarget = mountPoint;

  if (!mountTarget) {
    if (qiankunContainer instanceof Element) {
      mountTarget = qiankunContainer;
    } else if (container instanceof Element) {
      let existing = container.querySelector('.app-profile-root');
      if (!existing) {
        existing = document.createElement('div');
        existing.className = 'app-profile-root';
        container.innerHTML = '';
        container.appendChild(existing);
      }
      mountTarget = existing;
      mountPoint = existing;
    } else {
      mountTarget = document.querySelector('#app');
    }
  }

  if (!mountTarget) {
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

  const resolvedMount = mountPoint || mountTarget;
  const finalMount = resolvedMount || document.querySelector('#app');
  app.mount(finalMount || '#app');
  if (routerInstance && typeof routerInstance.isReady === 'function') {
    await routerInstance.isReady();
  }
  appInstance = app;
};

if (!window.singleSpaNavigate) {
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
  teardownRemoteShellBridge();

  if (appInstance) {
    appInstance.unmount();
    appInstance = null;
  }

  if (mountPoint && mountPoint.parentNode) {
    mountPoint.parentNode.removeChild(mountPoint);
  }
  mountPoint = null;

  if (props.container && props.container.querySelector) {
    const qiankunRoot = props.container.querySelector('#app');
    if (qiankunRoot) {
      qiankunRoot.innerHTML = '';
    }
  }

  routerInstance = null;
  storeInstance = null;
}
