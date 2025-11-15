<template>
  <div class="profile-app">
    <header class="profile-app__header">
      <h2>Profile Microfrontend</h2>
      <div class="profile-app__user" v-if="isAuthenticated">
        Viewing profile for <strong>{{ username }}</strong>
        <br />
        <code>
          Global Counter: {{ useBridgeStore.counter }}
        </code>
      </div>
      <div class="profile-app__user" v-else>
        Awaiting authentication from shell...
      </div>
    </header>
    <nav class="profile-app__nav">
      <router-link :to="{ name: 'profile-overview' }">Overview</router-link>
      <router-link :to="{ name: 'profile-activity' }">Activity</router-link>
      <router-link :to="{ name: 'profile-settings' }">Settings</router-link>
    </nav>
    <section class="profile-app__content">
      <code>
        {{ useBridgeStore.config }}
      </code>
      <!-- <router-view v-slot="{ Component }">
        <component
          :is="Component"
          :user="user"
          :shared-utils="sharedUtils"
          :shared-shell="sharedShell"
          :push-shared-state="pushSharedState"
        />
      </router-view> -->
    </section>
  </div>
</template>

<script>
import { useProfileStore } from './store';
export default {
  name: 'ProfileApp',
  inject: ['bridgeStore'],
  props: {
    sharedUtils: {
      type: Object,
      default: () => ({})
    }
  },
  data() {
    return {
      useProfileStore: useProfileStore(),
      useBridgeStore: this.$bridgeStore(),
      useAuth: this.$derivedStore.auth(),
    };
  },
  mounted() {
    this.useBridgeStore.$patch({
      counter: 1000
    });
    console.log('[Pinia->Vuex] mounted.', this.useBridgeStore.counter);
    console.log('[Pinia->Vuex] mounted.', this.$parentStore.getters['isAuthenticated']);
  },
  computed: {
    profile() {
      return this.useProfileStore.profile;
    },
    user() {
      return this.sharedUser;
    },
    username() {
      return 'Guest';
    },
    isAuthenticated() {
      return true;
    }
  },
  methods: {
    pushSharedState(partial = {}) {
      if (this.$microActions && typeof this.$microActions.pushSharedState === 'function') {
        this.$microActions.pushSharedState(partial);
      }
    }
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
</style>
