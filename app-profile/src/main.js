import Vue from 'vue';
import App from './App.vue';
import router from './router';
import store from './store';

Vue.config.productionTip = false;

let instance = null;
let offGlobalStateChange = null;
let isSyncingFromGlobal = false;

const teardownGlobalStateSync = () => {
  if (typeof offGlobalStateChange === 'function') {
    offGlobalStateChange();
    offGlobalStateChange = null;
  }
};

const setupGlobalStateSync = (props = {}) => {
  const { onGlobalStateChange, getGlobalState } = props;

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
    getGlobalState
  } = props;

  Vue.prototype.$sharedUtils = sharedUtils;
  Vue.prototype.$microActions = {
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

  setupGlobalStateSync(props);

  instance = new Vue({
    router,
    store,
    render: (h) =>
      h(App, {
        props: {
          sharedUtils,
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
  console.info('[app-profile] bootstraped');
}

export async function mount(props) {
  render(props);
}

export async function unmount() {
  teardownGlobalStateSync();

  if (instance) {
    instance.$destroy();
    instance.$el.innerHTML = '';
    instance = null;
  }
}
