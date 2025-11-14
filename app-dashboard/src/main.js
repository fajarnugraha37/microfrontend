/* eslint-disable no-underscore-dangle */
if (window.__POWERED_BY_QIANKUN__) {
  // eslint-disable-next-line no-undef
  __webpack_public_path__ = window.__INJECTED_PUBLIC_PATH_BY_QIANKUN__;
}
/* eslint-enable no-underscore-dangle */

import App from './App.vue';
import router from './router';
import { store } from './store';

window.Vue.config.productionTip = false;

let instance = null;
function render(props = {}) {
  const {
    container,
    store: parentStore,
  } = props;

  store.attachModule(parentStore);
  instance = new window.Vue({
    router,
    store: parentStore,
    render: (h) =>
      h(App, {
        store: store,
        props: {
        }
      })
  }).$mount(container ? container.querySelector('#app') : '#app');
}

if (!window.__POWERED_BY_QIANKUN__) {
  render();
}

export async function bootstrap() {
  console.info('[app-dashboard] bootstraped');
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

export async function update(props) {
  console.info('[app-dashboard] update props', props);
}
