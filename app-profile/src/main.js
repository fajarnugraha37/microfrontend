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
import { usePiniaStore } from 'mfe-components';

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
    piniaInstance.use(piniaPluginPersistedstate);
    const app = createApp(App, {
      props: {
        store: parentStore,
        globalStore: globalStore,
      },
      mounted() {
        console.info('[app-profile] mounted hook in App.vue');
      }
    });

    app.use(piniaInstance);
    app.use(usePiniaStore(pinia, piniaInstance), {
      'config': {},
    });
    app.use({
      install(appInstance, options) {
        console.info('[app-profile] install plugin with options', options);
      }
    })
    app.use(router);
    for (const pluginInstall of window._pluginRegistry.filter(item => item.plugin.type == 'global')) {
      const plugin = pluginInstall.plugin;
      const args = plugin.args || [];
      console.info(`[app-profile] installed global plugin ${plugin.name}@${plugin.version}`, plugin, args);
      app.use(plugin.install, ...args);
    }
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
}

export async function update(props) {
  console.info('[app-profile] update props', props);
  render(props);
}
