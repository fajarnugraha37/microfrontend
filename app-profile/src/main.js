/* eslint-disable no-underscore-dangle */
if (window.__POWERED_BY_QIANKUN__) {
  // eslint-disable-next-line no-undef
  __webpack_public_path__ = window.__INJECTED_PUBLIC_PATH_BY_QIANKUN__;
}
/* eslint-enable no-underscore-dangle */

import Vue from 'vue';
import App from './App.vue';
import router from './router';
import store from './store';

Vue.config.productionTip = false;

let instance = null;

function render(props = {}) {
  const {
    container,
    sharedUtils = {},
    onGlobalStateChange,
    setGlobalState,
    getGlobalState
  } = props;

  Vue.prototype.$sharedUtils = sharedUtils;
  Vue.prototype.$microActions = {
    onGlobalStateChange,
    setGlobalState,
    getGlobalState
  };

  instance = new Vue({
    router,
    store,
    render: (h) =>
      h(App, {
        props: {
          sharedUtils,
          onGlobalStateChange,
          setGlobalState,
          getGlobalState
        }
      })
  }).$mount(container ? container.querySelector('#app') : '#app');
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
    instance.$destroy();
    instance.$el.innerHTML = '';
    instance = null;
  }
}
