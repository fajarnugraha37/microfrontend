/// <reference path="../node_modules/mfe-components/global.d.ts" 
import * as veeValidate from 'vee-validate';
import { useForm, useField } from 'vee-validate';
import { all } from '@vee-validate/rules';
import { localize } from '@vee-validate/i18n';
import { createApp } from 'vue';
import { createPinia } from 'pinia';
import * as pinia from 'pinia';
import piniaPluginPersistedstate from 'pinia-plugin-persistedstate';
import App from './App.vue';
import router from './router';
import { veeValidateCompatPlugin, veeValidateDirectivePlugin } from './vee-validate';

/**
 * @type {import('vue').App}
 */
let piniaInstance;
/**
 * @type {import('vue').App}
 */
let app;

window['app-profile'] = window['app-profile'] || {};

/**
 * Mount hook for qiankun/module federation
 * @param {HTMLElement|string} selectorOrEl - Mount target
 * @param {any} props - Props from host
 */
export const mount = window['app-profile'].mount = function (selectorOrEl, props = {}) {
  const el =
    typeof selectorOrEl === 'string'
      ? document.querySelector(selectorOrEl)
      : selectorOrEl

  if (!el) {
    throw new Error('[app-profile] remote-app: mount target not found')
  }
  console.info('[app-profile] App mounting...', el);
  if (app == null) {
    try {
      piniaInstance = createPinia();
      piniaInstance.use(piniaPluginPersistedstate);
      app = createApp(App, {
        props: {
          store: window.$__store,
          ...props,
        },
        mount() {
          console.info('[app-profile] mounted hook in App.vue');
        },
        unmount() {
          console.info('[app-profile] unmounted hook in App.vue');
        }
      });

      app.use(piniaInstance);
      app.use(router);
      app.use(window.$__usePiniaStore(pinia, piniaInstance), {
        'config': {},
      });
      app.use(window.$__useTransferablePlugin, {
        piniaInstance: piniaInstance,
        router: router,
        veeValidate: veeValidate,
        rules: all,
        useForm: useForm,
        useField: useField,
        localize: localize,
      });
      app.use(veeValidateCompatPlugin);
      app.use(veeValidateDirectivePlugin());
      app.mixin({
        methods: {
          myGlobalMethod(msg) {
            console.log("[app-profile] [global]", msg);
          },
        },
      });
      app.mount(el);
    } catch (error) {
      console.error('[app-profile] ERROR: entry.js mount()', error);
      throw error;
    }
  } else {
    console.warn('[app-profile] App is already mounted.');
  }
  return Promise.resolve();
}

/**
 * Unmount hook for qiankun/module federation
 */
export const unmount = window['app-profile'].unmount = function () {
  console.info('[app-profile] App unmounting...');
  if (app != null) {
    app.unmount();
    app = null;
  } else {
    console.warn('[app-profile] App is not mounted.');
  }

  if (piniaInstance) {
    piniaInstance?.$__bridgeStore?.disposeBridge();
    piniaInstance?.$__derivedStore?.disposeBridge();
    piniaInstance = null;
  } else {
    console.warn('[app-profile] Pinia instance is not available.');
  }

  return Promise.resolve();
}