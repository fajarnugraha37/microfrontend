/// <reference path="../node_modules/pinia/dist/pinia.d.ts" />
/// <reference path="../node_modules/mfe-components/global.d.ts" />

import "./compat";
import "mfe-components";
import "bootstrap/dist/css/bootstrap.css";
import "bootstrap/dist/js/bootstrap.js";
import Vue from 'vue';

import { useRouter } from './router';
import { useUtilities } from './utils';
import { useValidators } from './validators';
import { useMixins } from './mixins';

import App from './App.vue';
import { useQiankun } from './qiankun';
import { useVuexStore } from 'mfe-components';
import { globalStore } from './store';

window.Vue.config.productionTip = false;
window.Vue.config.devtools = true;
window.Vue.config.errorHandler = function (err, vm, info) {
  console.error('[Vue Error]', err, info, vm);
}
window.Vue.config.warnHandler = function (msg, vm, trace) {
  console.warn('[Vue Warn]', msg, trace, vm);
}

useUtilities(window.Vue);
useMixins(window.Vue);
useValidators(window.Vue);
useVuexStore(window.Vue, globalStore);
useRouter(window.Vue);

const app = (() => {
  return new window.Vue({
    router: window.router,
    store: window.$__store,
    render: (h) => h(App)
  }).$mount('#app');
})();

useQiankun();

console.log('[main] Vue Computed', window.Vue.options.computed);
console.log('[main] Vue Directives', window.Vue.options.directives);
console.log('[main] Vue Filters', window.Vue.options.filters);
console.log('[main] Vue Methods', window.Vue.options.methods);
console.log('[main] Vue Installed Plugins', window.Vue.options._base._installedPlugins);
console.log('[main] App Methods', app.$options.methods);
console.log('[main] App Store', app.$store);
console.log('[main] App Validator', app.$validator);
console.log('[main] App Utils', app.$utils);

console.log('[main] registered plugins: ', window.$__pluginRegistry);
console.log('[main] registered mixins: ', window.$__mixinRegistry);
console.log('[main] registered directives: ', window.$__directiveRegistry);
console.log('[main] registered filters: ', window.$__filterRegistry);
console.log('[main] registered custom property: ', Object.getOwnPropertyNames(Vue.prototype || {}).filter(
  (k) => k.startsWith('$')));

export default app;
