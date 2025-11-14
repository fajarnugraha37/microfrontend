<template>
  <div class="example-bridge-component">
    <h2>Example Bridge Component</h2>

    <div class="status">
      <p><strong>Loading:</strong> {{ store.isLoading ? 'Yes' : 'No' }}</p>
      <p><strong>Items Count:</strong> {{ store.itemsCount }}</p>
      <p><strong>Has Items:</strong> {{ store.hasItems ? 'Yes' : 'No' }}</p>
      <p v-if="store.currentError"><strong>Error:</strong> {{ store.currentError }}</p>
    </div>

    <div class="items" v-if="store.items.length > 0">
      <h3>Items:</h3>
      <ul>
        <li v-for="item in store.items" :key="item.id">
          {{ item.name }}
          <button @click="removeItem(item.id)">Remove</button>
        </li>
      </ul>
    </div>

    <div class="actions">
      <button @click="loadItems" :disabled="store.loading">Load Items</button>
      <button @click="addRandomItem">Add Random Item</button>
    </div>

    <div class="raw-state" v-if="showRawState">
      <h3>Raw State:</h3>
      <pre>{{ JSON.stringify(store.$state, null, 2) }}</pre>
    </div>

    <button @click="showRawState = !showRawState">
      {{ showRawState ? 'Hide' : 'Show' }} Raw State
    </button>
  </div>
</template>

<script>
import { createVuexModulePiniaStore } from './createVuexModulePiniaStore.js';

// Create a Pinia store that proxies the 'example/' Vuex module
const useExampleStore = createVuexModulePiniaStore({
  id: 'legacy/example',
  namespace: 'example/',
});

export default {
  name: 'ExampleBridgeComponent',

  setup() {
    // Use the proxied store in your Vue 3 component
    const store = useExampleStore();

    // Initialize synchronization with Vuex store
    store.$initSync();

    return {
      store,
    };
  },

  data() {
    return {
      showRawState: false,
    };
  },

  methods: {
    async loadItems() {
      // Dispatch action through the bridge to Vuex
      await this.store.dispatchLocal('loadItems');
    },

    addRandomItem() {
      const randomName = `Item ${Math.floor(Math.random() * 1000)}`;
      // Commit mutation through the bridge to Vuex
      this.store.commitLocal('addItem', { name: randomName });
    },

    removeItem(itemId) {
      // Commit mutation through the bridge to Vuex
      this.store.commitLocal('removeItem', itemId);
    },
  },
};
</script>

<style scoped>
.example-bridge-component {
  max-width: 600px;
  margin: 0 auto;
  padding: 20px;
  border: 1px solid #ccc;
  border-radius: 8px;
}

.status {
  background: #f5f5f5;
  padding: 10px;
  border-radius: 4px;
  margin-bottom: 20px;
}

.items {
  margin-bottom: 20px;
}

.items ul {
  list-style: none;
  padding: 0;
}

.items li {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px;
  border: 1px solid #ddd;
  margin-bottom: 4px;
  border-radius: 4px;
}

.actions {
  margin-bottom: 20px;
}

.actions button {
  margin-right: 10px;
  padding: 8px 16px;
  background: #007bff;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.actions button:disabled {
  background: #ccc;
  cursor: not-allowed;
}

.actions button:hover:not(:disabled) {
  background: #0056b3;
}

.raw-state {
  margin-top: 20px;
  padding: 10px;
  background: #f8f9fa;
  border: 1px solid #dee2e6;
  border-radius: 4px;
}

.raw-state pre {
  white-space: pre-wrap;
  word-wrap: break-word;
}
</style>