import Vue from 'vue';
import App from './App.vue';
import router from './router';
import store from './store';
import { registerMicroApps, addGlobalUncaughtErrorHandler, start } from 'qiankun';
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

const microApps = [
  {
    name: 'app-dashboard',
    entry: '//localhost:8081',
    container: '#micro-app-container',
    activeRule: '/dashboard',
    props: {
      sharedUtils: { ...sharedUtils },
      storeBridge,
      onGlobalStateChange: globalActions.onGlobalStateChange,
      setGlobalState: globalActions.setGlobalState,
      offGlobalStateChange: globalActions.offGlobalStateChange,
      getGlobalState: globalActions.getGlobalState
    }
  },
  {
    name: 'app-profile',
    entry: '//localhost:8082',
    container: '#micro-app-container',
    activeRule: '/profile',
    props: {
      sharedUtils: { ...sharedUtils },
      storeBridge,
      onGlobalStateChange: globalActions.onGlobalStateChange,
      setGlobalState: globalActions.setGlobalState,
      offGlobalStateChange: globalActions.offGlobalStateChange,
      getGlobalState: globalActions.getGlobalState
    }
  }
];

registerMicroApps(microApps, {
  beforeLoad: [
    (appConfig) => {
      console.info(`[qiankun] before load -> ${appConfig.name}`);
      return Promise.resolve();
    }
  ],
  beforeMount: [
    (appConfig) => {
      console.info(`[qiankun] before mount -> ${appConfig.name}`);
      return Promise.resolve();
    }
  ],
  afterUnmount: [
    (appConfig) => {
      console.info(`[qiankun] after unmount -> ${appConfig.name}`);
      return Promise.resolve();
    }
  ]
});

addGlobalUncaughtErrorHandler((event) => {
  console.error('[qiankun] global error', event);
});

Vue.nextTick(() => {
  if (!window.qiankunStarted) {
    start();
    window.qiankunStarted = true;
  }
});

export default app;
