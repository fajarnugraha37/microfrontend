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
      <router-link to="/">Overview</router-link>
      <router-link to="/details">Details</router-link>
      <router-link to="/settings">Settings</router-link>
    </nav>
    <section class="dashboard-app__content">
      <router-view v-slot="{ Component }">
        <component
          :is="Component"
          :user="user"
          :shared-utils="sharedUtils"
          :set-global-state="setGlobalState"
        />
      </router-view>
    </section>
  </div>
</template>

<script>
export default {
  name: 'DashboardApp',
  props: {
    sharedUtils: {
      type: Object,
      default: () => ({})
    },
    onGlobalStateChange: {
      type: Function,
      default: null
    },
    setGlobalState: {
      type: Function,
      default: null
    },
    getGlobalState: {
      type: Function,
      default: null
    }
  },
  data() {
    return {
      user: null
    };
  },
  computed: {
    formattedLastLogin() {
      if (!this.user || !this.user.lastLogin || !this.sharedUtils.formatDate) {
        return '';
      }

      return this.sharedUtils.formatDate(this.user.lastLogin);
    }
  },
  methods: {
    bindGlobalState() {
      if (typeof this.onGlobalStateChange === 'function') {
        this.onGlobalStateChange((state) => {
          this.user = state.user;
        }, true);
      }

      if (typeof this.getGlobalState === 'function') {
        const state = this.getGlobalState();
        this.user = state ? state.user : null;
      }
    },
    notifyShellVisited() {
      if (typeof this.setGlobalState === 'function') {
        this.setGlobalState({
          lastVisitedDashboard: new Date().toISOString()
        });
      }
    }
  },
  mounted() {
    this.bindGlobalState();
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
