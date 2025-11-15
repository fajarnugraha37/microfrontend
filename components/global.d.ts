declare global {
  interface Window {
    Vue: typeof import('vue');
    Vuex: typeof import('vuex');
    VueRouter: typeof import('vue-router').default;
    Pinia: typeof import('pinia');
  }
}
export {};