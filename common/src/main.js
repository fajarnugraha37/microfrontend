/// <reference path="../node_modules/pinia/dist/pinia.d.ts" />
/// <reference path="../node_modules/mfe-components/global.d.ts" />

import "bootstrap/dist/css/bootstrap.css";
import "bootstrap/dist/js/bootstrap.js";
import Vue from 'vue';
import Router from 'vue-router';
import Vuex from 'vuex';

const origUse = Vue.use
const origMixin = Vue.mixin
const origDirective = Vue.directive
const origFilter = Vue.filter

window._pluginRegistry = []
window._mixinRegistry = []
window._directiveRegistry = []
window._filterRegistry = []

Vue.use = function (plugin, ...args) {
  window._pluginRegistry.push({ plugin, args })
  return origUse.call(this, plugin, ...args)
}
Vue.mixin = function (mixin) {
  window._mixinRegistry.push(mixin)
  return origMixin.call(this, mixin)
}
Vue.directive = function (name, def) {
  if (def) {
    window._directiveRegistry.push({ name, def })
  }
  return origDirective.call(this, name, def)
}
Vue.filter = function (name, fn) {
  if (fn) {
    window._filterRegistry.push({ name, fn })
  }
  return origFilter.call(this, name, fn)
}

import { useRouter } from './router';
import { useUtilities } from './utils';
import { useValidators } from './validators';
import { useMixins } from './mixins';

import App from './App.vue';
import { useQiankun } from './qiankun';
import { useVuexStore } from 'mfe-components';
import { globalStore } from './store';

window.Vue = Vue;
window.VueRouter = Router;
window.Vuex = Vuex;
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
useVuexStore(window.Vue, globalStore, (store) => {
});
useRouter(window.Vue);

const app = (() => {
  return new window.Vue({
    router: window.router,
    store: window.store,
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

console.log('[main] registered plugins: ', window._pluginRegistry);
console.log('[main] registered mixins: ', window._mixinRegistry);
console.log('[main] registered directives: ', window._directiveRegistry);
console.log('[main] registered filters: ', window._filterRegistry);
console.log('[main] registered custom property: ', Object.getOwnPropertyNames(Vue.prototype || {}).filter(
  (k) => k.startsWith('$')));

export default app;
