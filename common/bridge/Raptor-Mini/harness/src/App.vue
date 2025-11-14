<template>
  <div>
    <h1>Vuex → Pinia Bridge Harness</h1>
    <div style="display: flex; gap: 2rem;">
      <section style="flex: 1;">
        <h2>Host (Vuex 3)</h2>
        <p>Counter (Vuex): {{ hostCounter }} — <button @click="hostInc">+1</button></p>
        <p>Items: <span v-for="(i, idx) in hostItems" :key="idx">{{ i }} </span></p>
        <input v-model="hostNewItem" placeholder="Host add item" />
        <button @click="hostAddItem">Add</button>
      </section>

      <section style="flex: 1;">
        <h2>Microapp (Pinia bridge)</h2>
        <ExampleBridgeComponent />
      </section>
    </div>
  </div>
</template>

<script>
import { computed, ref } from 'vue'
import ExampleBridgeComponent from './ExampleBridgeComponent.vue'

export default {
  name: 'App',
  components: { ExampleBridgeComponent },
  setup() {
    // read and mutate the host store directly
    const hostStore = window.Vuex
    const hostCounter = computed(() => hostStore.state.example.counter)
    const hostItems = computed(() => hostStore.state.example.items)
    const hostNewItem = ref('')

    function hostInc() {
      hostStore.dispatch('example/increment', 1)
    }
    function hostAddItem() {
      if (!hostNewItem.value) return
      hostStore.dispatch('example/addItem', hostNewItem.value)
      hostNewItem.value = ''
    }

    return {
      hostCounter,
      hostItems,
      hostInc,
      hostNewItem,
      hostAddItem,
    }
  },
}
</script>
