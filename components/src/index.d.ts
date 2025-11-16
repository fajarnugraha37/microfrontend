import Vue from 'vue';

declare const CButton: Vue.ComponentOptions<Vue> & { new (): Vue };
declare const CInput: Vue.ComponentOptions<Vue> & { new (): Vue };

export { CButton, CInput };

// re-export utils
export * from './utils';

// re-export stores
export * from './stores';

export * from './bus';

declare const _default: {
  install(Vue: typeof import('vue')): void;
  CButton: typeof CButton;
  CInput: typeof CInput;
};

export default _default;
