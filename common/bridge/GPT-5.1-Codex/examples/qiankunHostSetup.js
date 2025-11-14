import Vue from 'vue';
import Vuex from 'vuex';
import { registerMicroApps, start } from 'qiankun';
import { exampleModule } from '../exampleModule.js';

Vue.use(Vuex);

const store = new Vuex.Store({
  strict: process.env.NODE_ENV !== 'production',
  modules: {
    example: exampleModule,
    // other legacy modules...
  },
});

// Expose the store for Vue 2 + Vuex microfrontends that rely on window.Vuex
window.Vuex = store;

registerMicroApps([
  {
    name: 'vue3-pinia-tasks',
    entry: 'https://microapps.internal/tasks',
    container: '#micro-frontend',
    activeRule: '/tasks',
    props: {
      globalStore: store,
      // You can also pass other shared services here.
    },
  },
  // Additional microapps here...
]);

start();
