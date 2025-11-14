<template>
  <div class="bridge-example">
    <h3>Pinia ↔ Vuex Bridge Example</h3>
    <div>
      <strong>Counter:</strong> {{ counter }}
      <button @click="increment">+1</button>
      <button @click="reset">Reset</button>
    </div>
    <div>
      <strong>Items ({{ itemsCount }}):</strong>
      <ul>
        <li v-for="(it, i) in items" :key="i">{{ it }}</li>
      </ul>
      <input v-model="newItem" placeholder="new item" />
      <button @click="addItem">Add</button>
    </div>
  </div>
</template>

<script>
import { ref, computed, onUnmounted } from 'vue'
import { createVuexModulePiniaStore } from './createVuexModulePiniaStore'

// create wrapper for example module namespace 'example/'
const useExampleStore = createVuexModulePiniaStore({ id: 'legacy/example', namespace: 'example/' })

export default {
  name: 'ExampleBridgeComponent',
  setup() {
    const store = useExampleStore()
    const newItem = ref('')

    const counter = computed(() => store.counter || 0)
    const items = computed(() => store.items || [])
    const itemsCount = computed(() => store.$bridgeGetters && store.$bridgeGetters.itemsCount ? store.$bridgeGetters.itemsCount : (items.value && items.value.length) || 0)

    function increment() {
      store.dispatchLocal('increment', 1)
    }

    function reset() {
      store.commitLocal('RESET')
    }

    function addItem() {
      if (!newItem.value) return
      store.dispatchLocal('addItem', newItem.value)
      newItem.value = ''
    }

    onUnmounted(() => {
      // optionally stop subscription
      if (store.stopBridge) store.stopBridge()
    })

    return {
      counter,
      items,
      newItem,
      itemsCount,
      increment,
      reset,
      addItem,
    }
  },
}
</script>
