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

export default app;
