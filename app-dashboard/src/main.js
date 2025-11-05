/* eslint-disable no-underscore-dangle */
if (window.__POWERED_BY_QIANKUN__) {
  // eslint-disable-next-line no-undef
  __webpack_public_path__ = window.__INJECTED_PUBLIC_PATH_BY_QIANKUN__;
}
/* eslint-enable no-underscore-dangle */

import Vue from 'vue';
import App from './App.vue';
import router from './router';
import store from './store';

Vue.config.productionTip = false;

let instance = null;
let offGlobalStateChange = null;
let isSyncingFromGlobal = false;
let teardownShellStoreBridge = null;
let shellStoreFacade = null;

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

const teardownGlobalStateSync = () => {
  if (typeof offGlobalStateChange === 'function') {
    offGlobalStateChange();
    offGlobalStateChange = null;
  }
};

const teardownRemoteShellBridge = () => {
  if (typeof teardownShellStoreBridge === 'function') {
    teardownShellStoreBridge();
    teardownShellStoreBridge = null;
  }
  shellStoreFacade = null;
  if (Vue.prototype.$shellStore) {
    Vue.prototype.$shellStore = null;
  }
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

const setupShellStoreBridge = (props = {}) => {
  teardownRemoteShellBridge();

  const { storeBridge } = props;
  if (!storeBridge || typeof storeBridge !== 'object') {
    return null;
  }

  const facade = createShellStoreFacade(storeBridge);
  shellStoreFacade = facade;
  Vue.prototype.$shellStore = facade;

  const syncSnapshot = (snapshot) => {
    if (!snapshot) {
      return;
    }

    const current = store.getters.sharedShell || {};
    if (!snapshotsEqual(current, snapshot)) {
      isSyncingFromGlobal = true;
      store.commit('replaceSharedShell', snapshot);
      isSyncingFromGlobal = false;
    }
  };

  if (typeof storeBridge.getState === 'function') {
    syncSnapshot(storeBridge.getState());
  }

  let unsubscribe = null;
  if (typeof storeBridge.subscribe === 'function') {
    unsubscribe = storeBridge.subscribe((_mutation, state) => {
      syncSnapshot(state);
    });
  }

  teardownShellStoreBridge = () => {
    if (typeof unsubscribe === 'function') {
      unsubscribe();
    }
    if (Vue.prototype.$shellStore === facade) {
      Vue.prototype.$shellStore = null;
    }
    shellStoreFacade = null;
  };

  return facade;
};

const setupGlobalStateSync = (props = {}) => {
  const { onGlobalStateChange, getGlobalState, storeBridge } = props;

  if (storeBridge && typeof storeBridge.subscribe === 'function') {
    teardownGlobalStateSync();
    return;
  }

  teardownGlobalStateSync();

  if (typeof onGlobalStateChange === 'function') {
    offGlobalStateChange = onGlobalStateChange((state) => {
      if (state && state.shellStore) {
        const existing = store.getters.sharedShell || {};
        const incoming = state.shellStore;
        const isDifferent = JSON.stringify(existing) !== JSON.stringify(incoming);
        if (isDifferent) {
          isSyncingFromGlobal = true;
          store.commit('replaceSharedShell', incoming);
          isSyncingFromGlobal = false;
        }
      }
    }, true);
  }

  if (typeof getGlobalState === 'function') {
    const current = getGlobalState();
    if (current && current.shellStore) {
      isSyncingFromGlobal = true;
      store.commit('replaceSharedShell', current.shellStore);
      isSyncingFromGlobal = false;
    }
  }
};

function render(props = {}) {
  const {
    container,
    sharedUtils = {},
    onGlobalStateChange,
    setGlobalState,
    getGlobalState,
    storeBridge
  } = props;

  Vue.prototype.$sharedUtils = sharedUtils;
  const resolvedShellStore = setupShellStoreBridge(props);

  Vue.prototype.$microActions = {
    onGlobalStateChange,
    setGlobalState,
    getGlobalState,
    commitToShell(type, payload, options) {
      if (resolvedShellStore && typeof resolvedShellStore.commit === 'function') {
        return resolvedShellStore.commit(type, payload, options);
      }
      if (storeBridge && typeof storeBridge.commit === 'function') {
        return storeBridge.commit(type, payload, options);
      }
      return undefined;
    },
    dispatchToShell(type, payload) {
      if (resolvedShellStore && typeof resolvedShellStore.dispatch === 'function') {
        return resolvedShellStore.dispatch(type, payload);
      }
      if (storeBridge && typeof storeBridge.dispatch === 'function') {
        return storeBridge.dispatch(type, payload);
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

      if (resolvedShellStore && typeof resolvedShellStore.replaceState === 'function') {
        resolvedShellStore.replaceState(nextState);
      }

      if (typeof setGlobalState === 'function') {
        setGlobalState({
          shellStore: nextState
        });
      }
    }
  };

  setupGlobalStateSync(props);

  instance = new Vue({
    router,
    store,
    render: (h) =>
      h(App, {
        props: {
          sharedUtils,
          shellStore: resolvedShellStore,
          onGlobalStateChange,
          setGlobalState,
          getGlobalState
        }
      })
  }).$mount(container ? container.querySelector('#app') : '#app');
}

if (!window.__POWERED_BY_QIANKUN__) {
  render();
}

export async function bootstrap() {
  console.info('[app-dashboard] bootstraped');
}

export async function mount(props) {
  render(props);
}

export async function unmount() {
  teardownGlobalStateSync();
  teardownRemoteShellBridge();

  if (instance) {
    instance.$destroy();
    instance.$el.innerHTML = '';
    instance = null;
  }
}

export async function update(props) {
  console.info('[app-dashboard] update props', props);
}
