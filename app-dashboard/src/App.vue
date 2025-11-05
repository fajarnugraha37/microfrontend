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
      <div class="dashboard-app__bridge" v-if="bridgeUserName">
        <span>Shell store (bridge): {{ bridgeUserName }}</span>
        <button class="dashboard-app__bridge-button" type="button" @click="logoutFromShell">
          Logout via shell
        </button>
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
    },
    shellStore: {
      type: Object,
      default: null
    }
  },
  computed: {
    ...mapGetters(['sharedShell', 'sharedUser']),
    user() {
      return this.sharedUser;
    },
    bridgeUserName() {
      const storeFromProps = this.shellStore || this.$shellStore || {};
      if (storeFromProps.getters && storeFromProps.getters.username) {
        return storeFromProps.getters.username;
      }
      if (typeof storeFromProps.getState === 'function') {
        const snapshot = storeFromProps.getState();
        return snapshot && snapshot.user ? snapshot.user.name : '';
      }
      return '';
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
    },
    logoutFromShell() {
      const shellStore = this.shellStore || this.$shellStore;
      if (shellStore && typeof shellStore.dispatch === 'function') {
        shellStore.dispatch('logout');
      } else if (
        this.$microActions &&
        typeof this.$microActions.dispatchToShell === 'function'
      ) {
        this.$microActions.dispatchToShell('logout');
      }
    }
  },
  mounted() {
    console.log('DashboardApp mounted with store:', this.shellStore || this.$shellStore);
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
  gap: 1.5rem;
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

.dashboard-app__bridge {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  font-size: 0.85rem;
}

.dashboard-app__bridge-button {
  border: 1px solid rgba(255, 255, 255, 0.6);
  background: transparent;
  color: #fff;
  padding: 0.25rem 0.75rem;
  border-radius: 999px;
  cursor: pointer;
}

.dashboard-app__bridge-button:hover {
  background: rgba(255, 255, 255, 0.1);
}
</style>
