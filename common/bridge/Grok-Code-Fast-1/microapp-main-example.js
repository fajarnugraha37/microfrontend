/**
 * Example of how to integrate the Vuex-to-Pinia bridge in a qiankun microfrontend.
 * This demonstrates the setup in a Vue 3 + Pinia microapp's main.js file.
 */

import { createApp } from 'vue';
import { createPinia } from 'pinia';
import { configureVuexBridge } from './vuexBridgeConfig.js';
import { createVuexModulePiniaStore } from './createVuexModulePiniaStore.js';
import { registerAllVuexModulesAsPinia } from './registerAllVuexModulesAsPinia.js';
import App from './App.vue';

// Global variables for cleanup
let app = null;
let pinia = null;

/**
 * Bootstrap lifecycle - called once when the microapp is initialized
 */
export async function bootstrap() {
  console.log('[Microapp] Bootstrap');
}

/**
 * Mount lifecycle - called when the microapp is activated
 * @param {Object} props - Props passed from qiankun, including globalStore
 */
export async function mount(props) {
  console.log('[Microapp] Mount with props:', props);

  // Create Pinia instance
  pinia = createPinia();

  // Configure the bridge to access the global Vuex store
  // First try props.globalStore (from qiankun), then fallback to window.Vuex
  configureVuexBridge({
    getGlobalStore: () => {
      return (props && props.globalStore) || window.Vuex || null;
    },
  });

  // Option 1: Create specific stores for known modules
  const useAuthStore = createVuexModulePiniaStore({
    id: 'legacy/auth',
    namespace: 'auth/',
  });

  const useProfileStore = createVuexModulePiniaStore({
    id: 'legacy/profile',
    namespace: 'profile/',
  });

  // Option 2: Auto-register all available Vuex modules as Pinia stores
  // This creates stores for all namespaced modules in the global store
  const allStores = registerAllVuexModulesAsPinia();
  console.log('[Microapp] Auto-registered stores:', Object.keys(allStores));

  // Create and mount the Vue app
  app = createApp(App);
  app.use(pinia);

  // Mount to the container provided by qiankun
  const mountPoint = props.container
    ? props.container.querySelector('#app')
    : '#app';

  app.mount(mountPoint);

  console.log('[Microapp] Mounted successfully');
}

/**
 * Unmount lifecycle - called when the microapp is deactivated
 * @param {Object} props - Props passed from qiankun
 */
export async function unmount(props) {
  console.log('[Microapp] Unmount');

  // Unmount the Vue app
  if (app) {
    app.unmount();
    app = null;
  }

  // Clear Pinia instance
  pinia = null;

  console.log('[Microapp] Unmounted successfully');
}