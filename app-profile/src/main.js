/// <reference path="../node_modules/mfe-components/global.d.ts" />

/* eslint-disable no-underscore-dangle */
if (window.__POWERED_BY_QIANKUN__) {
  // eslint-disable-next-line no-undef
  window.__webpack_public_path__ = window.__INJECTED_PUBLIC_PATH_BY_QIANKUN__;
}

import { createApp } from 'vue';
import { createPinia } from 'pinia';
import * as pinia from 'pinia';
import App from './App.vue';
import router from './router';

/**
 * @type {import('vue').App}
 */
let instance = null;
function render(props = {}) {
  try {
    const {
      container,
      store: parentStore,
      globalStore,
    } = props;

    // store.attachModule(parentStore);
    // store.attachModule(globalStore);
    const piniaInstance = createPinia();
    const app = createApp(App, {
      props: {
        store: parentStore,
        globalStore: globalStore,
      },
      mounted() {
      }
    });
    app.use(piniaInstance);
    app.use(window.usePiniaStore(pinia), {
      'config': {},
    });
    app.use(router);
    app.mount(container ? container.querySelector('#app') : '#app');
    instance = app;
  } catch (error) {
    console.error('Error during render:', error);
  }

  console.info('[app-profile] props from main framework', props);
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
  if (instance) {
    instance.unmount();
    instance._container.innerHTML = '';
    instance = null;
  }
}

export async function update(props) {
  console.info('[app-profile] update props', props);
}
