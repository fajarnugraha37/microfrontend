/// <reference path="../global.d.ts" />
/// <reference path="../node_modules/pinia/dist/pinia.d.ts" />

import "./init";
import Vue from 'vue';
import Router from 'vue-router';
import Vuex from 'vuex';

const origUse = Vue.use
const origMixin = Vue.mixin
const origDirective = Vue.directive
const origFilter = Vue.filter

Vue._pluginRegistry = []
Vue._mixinRegistry = []
Vue._directiveRegistry = []
Vue._filterRegistry = []

Vue.use = function (plugin, ...args) {
  Vue._pluginRegistry.push({ plugin, args })
  return origUse.call(this, plugin, ...args)
}
Vue.mixin = function (mixin) {
  Vue._mixinRegistry.push(mixin)
  return origMixin.call(this, mixin)
}
Vue.directive = function (name, def) {
  if (def) {
    Vue._directiveRegistry.push({ name, def })
  }
  return origDirective.call(this, name, def)
}
Vue.filter = function (name, fn) {
  if (fn) {
    Vue._filterRegistry.push({ name, fn })
  }
  return origFilter.call(this, name, fn)
}

import { useRouter } from './router';
import { useVuexStore } from './store';
import { useUtilities } from './utils';
import { useValidators } from './validators';
import { useMixins } from './mixins';

import App from './App.vue';
import { useQiankun } from './qiankun';

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
useVuexStore(window.Vue);
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

console.log('[main] registered plugins: ', Vue._pluginRegistry);
console.log('[main] registered mixins: ', Vue._mixinRegistry);
console.log('[main] registered directives: ', Vue._directiveRegistry);
console.log('[main] registered filters: ', Vue._filterRegistry);
console.log('[main] registered custom property: ', Object.getOwnPropertyNames(Vue.prototype || {}).filter(
  (k) => k.startsWith('$')));

export default app;
