import Vue from 'vue';
import Router from 'vue-router';
import Vuex from 'vuex';

import { useRouter } from './router';
import { useStore } from './store';
import { useUtilities } from './utils';
import { useValidators } from './validators';
import { useMixins } from './mixins';

import App from './App.vue';
import { useQiankun } from './qiankun';

window.Vue = Vue;
window.Vue.config.productionTip = false;
window.VueRouter = Router;
window.Vuex = Vuex;

useUtilities(window.Vue);
useMixins(window.Vue);
useValidators(window.Vue);
useStore(window.Vue);
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
export default app;
