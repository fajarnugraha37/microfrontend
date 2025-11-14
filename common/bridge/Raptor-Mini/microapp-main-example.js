import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue' // you can replace with a small example App if needed
import { configureVuexBridge } from './vuexBridgeConfig'
import { registerAllVuexModulesAsPinia } from './registerAllVuexModulesAsPinia'

let app = null
let pinia = null

export async function mount(props) {
  pinia = createPinia()
  configureVuexBridge({
    getGlobalStore: () => (props && props.globalStore) || (typeof window !== 'undefined' ? window.Vuex : null),
  })

  // Optionally register all Vuex modules as Pinia stores
  const stores = registerAllVuexModulesAsPinia()
  // `stores` is a map of namespace -> store factory. You can call the factory to get the store instance.

  app = createApp(App)
  app.use(pinia)
  const mountEl = props && props.container ? props.container.querySelector('#app') : document.getElementById('app')
  app.mount(mountEl || '#app')
}

export async function unmount() {
  if (app) {
    app.unmount()
  }
  app = null
  pinia = null
}
