<template>
  <div class="dashboard-app">
    <header class="dashboard-app__header">
      <h2>Dashboard Microfrontend</h2>
      <div class="dashboard-app__user" v-if="user">
        Welcome, {{ user.name }}
        <span v-if="user.lastLogin">
          · Last login: {{ formattedLastLogin }}
        </span>
      </div>
      <div class="dashboard-app__user" v-else>
        No user detected. Please login from the shell.
      </div>
    </header>
    <nav class="dashboard-app__nav">
      <router-link :to="{ name: 'dashboard-home' }">Overview</router-link>
      <router-link :to="{ name: 'dashboard-details' }">Details</router-link>
      <router-link :to="{ name: 'dashboard-settings' }">Settings</router-link>
    </nav>
    <section class="dashboard-app__content">
      <router-view v-slot="{ Component }">
        <component
          :is="Component"
          :user="user"
          :shared-utils="sharedUtils"
          :shared-shell="sharedShell"
          :push-shared-state="pushSharedState"
        />
      </router-view>
    </section>
  </div>
</template>

<script>
import { mapGetters } from 'vuex';

export default {
  name: 'DashboardApp',
  props: {
    sharedUtils: {
      type: Object,
      default: () => ({})
    }
  },
  computed: {
    ...mapGetters(['sharedShell', 'sharedUser']),
    user() {
      return this.sharedUser;
    },
    formattedLastLogin() {
      if (!this.user || !this.user.lastLogin || !this.sharedUtils.formatDate) {
        return '';
      }

      return this.sharedUtils.formatDate(this.user.lastLogin);
    }
  },
  methods: {
    pushSharedState(partial = {}) {
      if (this.$microActions && typeof this.$microActions.pushSharedState === 'function') {
        this.$microActions.pushSharedState(partial);
      }
    },
    notifyShellVisited() {
      this.pushSharedState({
        lastVisitedDashboard: new Date().toISOString()
      });
    }
  },
  mounted() {
    this.notifyShellVisited();
  }
};
</script>

<style scoped>
.dashboard-app {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.dashboard-app__header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: #1e3a8a;
  color: #fff;
  padding: 1rem 1.5rem;
  border-radius: 8px;
}

.dashboard-app__nav {
  display: flex;
  gap: 1rem;
}

.dashboard-app__nav a {
  text-decoration: none;
  color: #1e3a8a;
  font-weight: 600;
}

.dashboard-app__nav a.router-link-exact-active {
  border-bottom: 2px solid #1e3a8a;
}

.dashboard-app__content {
  background: #fff;
  border-radius: 8px;
  padding: 1.5rem;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.08);
  min-height: 320px;
}
</style>
