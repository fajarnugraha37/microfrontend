<template>
  <section class="legacy-bridge">
    <header>
      <h2>Legacy Task Summary</h2>
      <p>Status: <strong>{{ store.status }}</strong></p>
    </header>
    <p>Total tasks (Vuex getter): {{ summary.total }}</p>
    <p>Completed: {{ summary.completed }}</p>
    <p>Pending: {{ summary.pending }}</p>
    <p>Completion rate: {{ completionPercent }}%</p>
    <button type="button" @click="reload" :disabled="store.status === 'loading'">
      Refresh via Vuex action
    </button>
  </section>
</template>

<script setup>
import { computed } from 'vue';
import { createVuexModulePiniaStore } from '../createVuexModulePiniaStore.js';

const useExampleBridgeStore = createVuexModulePiniaStore({
  id: 'legacy/exampleTasks',
  namespace: 'example/',
});

const defaultSummary = {
  total: 0,
  completed: 0,
  pending: 0,
  completionRate: 0,
};

const store = useExampleBridgeStore();
const summary = computed(() => store.legacyGetters.completionSummary || defaultSummary);
const completionPercent = computed(() => Math.round(summary.value.completionRate * 100));

async function reload() {
  await store.dispatchLocal('fetchTasks');
}
</script>

<style scoped>
.legacy-bridge {
  border: 1px solid #eee;
  border-radius: 8px;
  padding: 1rem;
}

button[disabled] {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>
