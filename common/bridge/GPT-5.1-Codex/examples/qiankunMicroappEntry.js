import { createApp } from 'vue';
import { createPinia } from 'pinia';
import App from '../src/App.vue'; // replace with actual root component
import {
  configureVuexBridge,
  createVuexModulePiniaStore,
  registerAllVuexModulesAsPinia,
} from '../index.js';

let appInstance = null;
let piniaInstance = null;

/**
 * qiankun bootstrap lifecycle (optional)
 */
export async function bootstrap() {
  // noop
}

/**
 * qiankun mount lifecycle.
 *
 * @param {Object} props
 */
export async function mount(props = {}) {
  piniaInstance = createPinia();

  configureVuexBridge({
    getGlobalStore: () => props.globalStore || window.Vuex || null,
  });

  // Option A: manually register a module mirror
  const useExampleStore = createVuexModulePiniaStore({
    id: 'legacy/example',
    namespace: 'example/',
  });

  // Option B: automatically mirror everything
  const storeMap = registerAllVuexModulesAsPinia({
    idPrefix: 'legacy',
  });

  appInstance = createApp(App);
  appInstance.use(piniaInstance);
  appInstance.provide('legacyStores', storeMap);
  appInstance.mount(props.container ? props.container.querySelector('#app') : '#app');

  // Example usage inside setup()
  // const exampleStore = useExampleStore();
  // exampleStore.dispatchLocal('fetchTasks');
}

/**
 * qiankun unmount lifecycle.
 *
 * @param {Object} props
 */
export async function unmount(props = {}) {
  if (appInstance) {
    appInstance.unmount();
    appInstance = null;
  }
  piniaInstance = null;
  if (props.container) {
    props.container.innerHTML = '';
  }
}
