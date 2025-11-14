<template>
  <div>
    <h3>Legacy Module Bridge Demo</h3>
    <div>count: {{ store.count }}</div>
    <div>items: {{ store.items }}</div>
    <button @click="inc">Increment (commit)</button>
    <button @click="addItem">Add Item (commit)</button>
    <button @click="loadAsync">Dispatch async action</button>
  </div>
</template>

<script>
import { onMounted } from 'vue'
import { createVuexModulePiniaStore } from './createVuexModulePiniaStore'

// create/use the Pinia proxy for Vuex module 'example/'
const useExampleStore = createVuexModulePiniaStore({ id: 'legacy/example', namespace: 'example/' })

export default {
  name: 'ExampleBridgeComponent',
  setup() {
    const store = useExampleStore()

    onMounted(() => {
      // ensure bridge initialized; factory wrapper already calls _ensureBridge once
    })

    function inc() {
      // commit via Vuex mutation through the bridge
      store.commitLocal('SET_COUNT', (store.count || 0) + 1)
    }

    function addItem() {
      store.commitLocal('PUSH_ITEM', { id: Date.now(), name: 'New' })
    }

    function loadAsync() {
      // dispatch a namespaced action
      store.dispatchLocal('incrementAsync', 2).then(() => {
        console.log('dispatched')
      })
    }

    return { store, inc, addItem, loadAsync }
  }
}
</script>
