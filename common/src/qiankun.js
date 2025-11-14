import Vue from 'vue';
import { registerMicroApps, addGlobalUncaughtErrorHandler, addErrorHandler, start } from 'qiankun';
import globalActions from './state';
import { utils as sharedUtils } from './utils';


export const useQiankun = () => {
  if (window.qiankunStarted === true) {
    console.warn('[qiankun] already started, skipping initialization.');
    return;
  }

  let isSyncingFromGlobal = false;
  let serializedShellStore = JSON.stringify(window.store.state);

  globalActions.setShellStore(window.store.state);

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
  console.log('[qiankun] store synchronization setup complete.', window.store);

  /**
   * @type {import('qiankun').RegistrableApp<any>[]}
   */
  const microApps = [
    {
      name: 'app-dashboard',
      entry: '//localhost:8081',
      container: '#micro-app-container',
      activeRule: '/dashboard',
      props: {
        store: window.store,
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
        store: window.store,
        sharedUtils: { ...sharedUtils },
        onGlobalStateChange: globalActions.onGlobalStateChange,
        setGlobalState: globalActions.setGlobalState,
        offGlobalStateChange: globalActions.offGlobalStateChange,
        getGlobalState: globalActions.getGlobalState
      }
    }
  ];

  /** 
   * @type {import('qiankun').FrameworkLifeCycles<any>} 
   * */
  const lifecycle = {
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
  }

  addGlobalUncaughtErrorHandler((event) => {
    console.error('[qiankun] global error', event);
  });

  addErrorHandler((err) => {
    console.error('[qiankun] error', err);
  });

  registerMicroApps(microApps, lifecycle);

  Vue.nextTick(() => {
    if (!window.qiankunStarted) {
      start();
      window.qiankunStarted = true;
    }
  });
}