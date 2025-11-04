import Vue from 'vue';
import App from './App.vue';
import router from './router';
import store from './store';
import { registerMicroApps, addGlobalUncaughtErrorHandler, start } from 'qiankun';
import globalActions from './state';
import * as sharedUtils from './utils';

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

const microApps = [
  {
    name: 'app-dashboard',
    entry: '//localhost:8081',
    container: '#micro-app-container',
    activeRule: '/dashboard',
    props: {
      sharedUtils: { ...sharedUtils },
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
