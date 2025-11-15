<template>
  <article class="profile-activity">
    <h3>Recent Activity</h3>
    <ul>
      <li v-for="item in timeline" :key="item.id">
        <strong>{{ item.label }}</strong>
        <span>{{ formatted(item.timestamp) }}</span>
      </li>
    </ul>
    <c-button @click="notifyShell">Notify Shell About Activity</c-button>
  </article>
</template>

<script>
import { CButton } from 'mfe-components';

export default {
  name: 'ProfileActivity',
  components: {
    CButton
  },
  props: {
    sharedUtils: {
      type: Object,
      default: () => ({})
    },
    pushSharedState: {
      type: Function,
      default: null
    }
  },
  data() {
    return {
      useBridgeStore: this.$bridgeStore(),
      useAuth: this.$derivedStore.auth(),
      timeline: [
        {
          id: 1,
          label: 'Logged in via shell',
          timestamp: new Date().toISOString()
        },
        {
          id: 2,
          label: 'Viewed dashboard',
          timestamp: new Date(Date.now() - 1000 * 60 * 15).toISOString()
        }
      ]
    };
  },
  methods: {
    formatted(timestamp) {
      return this.sharedUtils.formatDate
        ? this.sharedUtils.formatDate(timestamp)
        : timestamp;
    },
    notifyShell() {
      if (typeof this.pushSharedState === 'function') {
        this.pushSharedState({
          profileLastActivity: new Date().toISOString()
        });
      }
    }
  }
};
</script>

<style scoped>
.profile-activity {
  display: grid;
  gap: 1.5rem;
}

ul {
  list-style: none;
  padding: 0;
  display: grid;
  gap: 1rem;
}

li {
  background: #f9fafb;
  border-radius: 6px;
  padding: 1rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

span {
  color: #6b7280;
}
</style>
