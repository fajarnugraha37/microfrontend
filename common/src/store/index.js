import { productStore } from './product';
import { authStore } from './auth';
import { globalStore } from './global';

/**
 * 
 * @param {import('vue').VueConstructor} vue 
 */
export const useVuexStore = (vue) => {
  vue.use(new class VuexStorePlugin {
    install(Vue) {
      Vue.use(window.Vuex);
      /** @type {import('vuex').Store} */
      const store = window.store = new window.Vuex.Store(globalStore);

      store.registerModule('auth', authStore);
      store.registerModule('product', productStore);

      store.subscribe((mutation, state) => {
        // eslint-disable-next-line no-console
        console.log(`[Vuex] Mutation: ${mutation.type}`, JSON.stringify(state));
        console.log(`[Vuex] Mutation: ${Object.keys(mutation.payload).join(', ')}`);
      });
      store.watch(
        (state) => state.auth.token,
        (newToken) => {
          // eslint-disable-next-line no-console
          console.log('[Vuex] Auth token changed:', newToken);
        }
      );
    }
  });
}


/**
 * 
 * @param {import('vue').VueConstructor} vue 
 */
export const usePiniaStore = (vue) => {
  vue.use(new class PiniaStorePlugin {
    install(Vue) {

    }
  });
}