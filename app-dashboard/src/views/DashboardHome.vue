<template>
  <article class="dashboard-home">
    <header>
      <h3>Overview</h3>
      <p v-if="user">Glad to see you, {{ user.name }}.</p>
      <p v-else>Please login from the shell to personalise the dashboard.</p>
    </header>
    <section class="dashboard-home__stats">
      <div class="stat">
        <strong>{{ stats.totalUsers }}</strong>
        <span>Total Users</span>
      </div>
      <div class="stat">
        <strong>{{ stats.activeSessions }}</strong>
        <span>Active Sessions</span>
      </div>
      <div class="stat">
        <strong>{{ stats.satisfaction }}%</strong>
        <span>Satisfaction</span>
      </div>
    </section>
    <footer class="dashboard-home__footer">
      <c-button @click="notifyShell">Mark Dashboard Visited</c-button>
      <small v-if="sharedUtils && sharedUtils.formatDate">
        Refreshed at: {{ sharedUtils.formatDate(lastRefresh) }}
      </small>
    </footer>
  </article>
</template>

<script>
import { mapGetters } from 'vuex';
import { CButton } from 'mfe-components';

export default {
  name: 'DashboardHome',
  components: {
    CButton
  },
  props: {
    user: {
      type: Object,
      default: null
    },
    sharedUtils: {
      type: Object,
      default: () => ({})
    },
    setGlobalState: {
      type: Function,
      default: null
    }
  },
  data() {
    return {
      lastRefresh: new Date()
    };
  },
  computed: {
    ...mapGetters(['stats'])
  },
  methods: {
    notifyShell() {
      if (typeof this.setGlobalState === 'function') {
        this.setGlobalState({
          dashboardLastVisited: new Date().toISOString()
        });
      }
    }
  }
};
</script>

<style scoped>
.dashboard-home {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.dashboard-home__stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
  gap: 1rem;
}

.stat {
  background: #1e3a8a;
  color: #fff;
  border-radius: 6px;
  padding: 1rem;
  text-align: center;
}

.dashboard-home__footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

small {
  color: #4b5563;
}
</style>
