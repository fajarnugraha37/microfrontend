import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import { configureVuexBridge } from '../../vuexBridgeConfig'
import { exampleModule } from '../../exampleModule'
import { createStore } from 'vuex'


// Create a lightweight Vuex store (Vuex 4 compatible) simulating the shell
const store = createStore({
  modules: {
    example: exampleModule,
  },
})
// Make it available globally and for our bridge
window.Vuex = store

configureVuexBridge({
  getGlobalStore: () => window.Vuex,
})

const pinia = createPinia()
const app = createApp(App)
app.use(pinia)
app.mount('#app')

// Expose store for manual testing in the console
window.__HARNESS_VUEX_STORE__ = store

// demonstrate a mutation from the host every 2s to show bridge updates
setInterval(() => {
  const current = store.state.example.counter || 0
  store.commit('example/SET_COUNTER', current + 1)
}, 2000)
