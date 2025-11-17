/// <reference path="../node_modules/mfe-components/global.d.ts" />

/* eslint-disable no-underscore-dangle */
if (window.__POWERED_BY_QIANKUN__) {
  // eslint-disable-next-line no-undef
  window.__webpack_public_path__ = window.__INJECTED_PUBLIC_PATH_BY_QIANKUN__;
}

import { createApp } from 'vue';
import { createPinia } from 'pinia';
import * as pinia from 'pinia';
import piniaPluginPersistedstate from 'pinia-plugin-persistedstate';
import App from './App.vue';
import router from './router';

/**
 * @type {import('vue').App}
 */
let instance = null;
/**
 * @type {import('pinia').Pinia}
 */
let piniaInstance = null;
function render(props = {}) {
  try {
    const {
      container,
      store: parentStore,
    } = props;

    // store.attachModule(parentStore);
    if (piniaInstance == null) {
      piniaInstance = createPinia();
      piniaInstance.use(piniaPluginPersistedstate);
    }

    const app = createApp(App, {
      props: {
        store: parentStore,
      },
      mounted() {
        console.info('[app-profile] mounted hook in App.vue');
      }
    });

    app.use(piniaInstance);
    app.use(router);
    app.use(window.$__usePiniaStore(pinia, piniaInstance), {
      'config': {},
    });
    app.use(window.$__useTransferablePlugin);
    app.mixin({
      methods: {
        myGlobalMethod(msg) {
          console.log("[global]", msg);
        },
      },
    });
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
  console.info('[app-profile] mount with props', props);
  render(props);
}

export async function unmount() {
  console.info('[app-profile] unmount');
  if (instance) {
    instance.unmount();
    instance._container.innerHTML = '';
    instance = null;
  }
  if (piniaInstance) {
    piniaInstance?.$__bridgeStore?.disposeBridge();
    piniaInstance?.$__derivedStore?.disposeBridge();
    piniaInstance = null;
  }
}

export async function update(props) {
  console.info('[app-profile] update props', props);
  render(props);
}
