<template>
  <div class="profile-app">
    <header class="profile-app__header">
      <h2>Profile Microfrontend</h2>
      <div class="profile-app__user" v-if="user">
        Viewing profile for <strong>{{ user.name }}</strong>
      </div>
      <div class="profile-app__user" v-else>
        Awaiting authentication from shell...
      </div>
      <div class="profile-app__bridge" v-if="bridgeUserName">
        <span>Shell store (bridge): {{ bridgeUserName }}</span>
        <button class="profile-app__bridge-button" type="button" @click="logoutFromShell">
          Logout via shell
        </button>
      </div>
    </header>
    <nav class="profile-app__nav">
      <router-link :to="{ name: 'profile-overview' }">Overview</router-link>
      <router-link :to="{ name: 'profile-activity' }">Activity</router-link>
      <router-link :to="{ name: 'profile-settings' }">Settings</router-link>
    </nav>
    <section class="profile-app__content">
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
import { mount } from './main';

export default {
  name: 'ProfileApp',
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
    }
  },
  methods: {
    pushSharedState(partial = {}) {
      if (this.$microActions && typeof this.$microActions.pushSharedState === 'function') {
        this.$microActions.pushSharedState(partial);
      }
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
    console.log('ProfileApp mounted with store:', this.shellStore || this.$shellStore);
  }
};
</script>

<style scoped>
.profile-app {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.profile-app__header {
  background: #7c3aed;
  color: #fff;
  padding: 1rem 1.5rem;
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.profile-app__nav {
  display: flex;
  gap: 1rem;
}

.profile-app__nav a {
  text-decoration: none;
  color: #7c3aed;
  font-weight: 600;
}

.profile-app__nav a.router-link-exact-active {
  border-bottom: 2px solid #7c3aed;
}

.profile-app__content {
  background: #fff;
  border-radius: 8px;
  padding: 1.5rem;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.08);
  min-height: 320px;
}

.profile-app__bridge {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  font-size: 0.85rem;
}

.profile-app__bridge-button {
  border: 1px solid rgba(255, 255, 255, 0.6);
  background: transparent;
  color: #fff;
  padding: 0.25rem 0.75rem;
  border-radius: 999px;
  cursor: pointer;
}

.profile-app__bridge-button:hover {
  background: rgba(255, 255, 255, 0.15);
}
</style>
