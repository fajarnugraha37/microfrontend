/// <reference path="../global.d.ts" />

import CButton from './components/CButton.vue';
import CInput from './components/CInput.vue';

const components = [CButton, CInput];

const install = (Vue) => {
  if (install.installed) {
    return;
  }
  install.installed = true;
  components.forEach((component) => {
    console.log('Registering component:', component.name);
    Vue.component(component.name, component);
  });
};

if (typeof window !== 'undefined' && window.Vue) {
  install(window.Vue);
}

export { CButton, CInput };

export default {
  install,
  CButton,
  CInput
};
