<template>
  <article class="profile-overview">
    <h3>Overview</h3>
    <p v-if="isAuthenticated">
      <strong>{{ username }}</strong>'s profile. 
    </p>
    <p v-else>
      Login from the shell to load profile data.
    </p>
    <section>
      <h4>Bio</h4>
      <p>{{ profile.bio }}</p>
    </section>
    <section>
      <h4>Interests</h4>
      <ul>
        <li v-for="interest in profile.interests" :key="interest">
          {{ interest }}
        </li>
      </ul>
    <c-button>Notify Shell About Activity</c-button>
    </section>
  </article>
</template>

<script>
import { useProfileStore } from '../store';
import { CButton } from 'mfe-components';

export default {
  name: 'ProfileOverview',
  components: {
    CButton
  },
  props: {
    sharedShell: {
      type: Object,
      default: () => ({})
    },
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
  computed: {
    profile() {
      return this.useProfileStore.profile;
    },
    username() {
      return this.sharedShell && this.sharedShell.user
        ? this.sharedShell.user.name
        : 'Guest';
    },
    isAuthenticated() {
      return this.sharedShell && this.sharedShell.isAuthenticated
        ? this.sharedShell.isAuthenticated
        : false;
    },
    user() {
      return this.sharedShell && this.sharedShell.user ? this.sharedShell.user : null;
    }
  }
};
</script>

<style scoped>
.profile-overview {
  display: grid;
  gap: 1.5rem;
}

ul {
  padding-left: 1.25rem;
}
</style>
