/// <reference path="../global.d.ts" />

import "./initialize";
import CButton from './components/CButton.vue';
import CInput from './components/CInput.vue';
import { 
  deepPatch, 
  getModuleState 
} from "./utils";
import {
  bridgeReplaceState, 
  createGlobalPiniaStoreFromVuex, 
  createPiniaStoreFromVuex, 
  createVuexModulePiniaBridge, 
  createVuexRootPiniaBridge, 
  registerBridges, 
  useDerivedStore, 
  usePiniaStore, 
  useVuexStore 
} from "./stores";
import {
  bus,
  mfeEventBus
} from "./bus";

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

export {
  CButton,
  CInput,
  deepPatch,
  getModuleState,
  bridgeReplaceState,
  createGlobalPiniaStoreFromVuex,
  createPiniaStoreFromVuex,
  createVuexModulePiniaBridge,
  createVuexRootPiniaBridge,
  registerBridges, useDerivedStore,
  usePiniaStore,
  useVuexStore,
  bus,
  mfeEventBus
};

export default {
  install,
  CButton,
  CInput,
  deepPatch,
  getModuleState,
  bridgeReplaceState,
  createGlobalPiniaStoreFromVuex,
  createPiniaStoreFromVuex,
  createVuexModulePiniaBridge,
  createVuexRootPiniaBridge,
  registerBridges, useDerivedStore,
  usePiniaStore,
  useVuexStore,
  bus,
  mfeEventBus
};
