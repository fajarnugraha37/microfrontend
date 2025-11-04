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

export default {
  name: 'ProfileApp',
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
