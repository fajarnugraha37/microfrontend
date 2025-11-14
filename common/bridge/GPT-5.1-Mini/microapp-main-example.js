/**
 * Example qiankun microapp entry showing integration with the bridge.
 * This file is illustrative — adapt to your microapp structure.
 */
import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import { configureVuexBridge } from './vuexBridgeConfig'
import { createVuexModulePiniaStore } from './createVuexModulePiniaStore'

let app = null
let pinia = null

export async function bootstrap() {
  // called once
}

export async function mount(props) {
  pinia = createPinia()

  configureVuexBridge({
    getGlobalStore: () => (props && props.globalStore) || (typeof window !== 'undefined' ? window.Vuex : null),
  })

  // Create a Pinia store that proxies Vuex module "some/"
  const useSomeStore = createVuexModulePiniaStore({ id: 'legacy/some', namespace: 'some/' })

  app = createApp(App)
  app.use(pinia)
  app.mount(props.container ? props.container.querySelector('#app') : '#app')

  // Example: read store from anywhere within the microapp
  // const someStore = useSomeStore()
}

export async function unmount() {
  if (app) {
    app.unmount()
    app = null
  }
  pinia = null
}
