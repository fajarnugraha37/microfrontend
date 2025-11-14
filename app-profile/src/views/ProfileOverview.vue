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
    </section>
  </article>
</template>

<script>
import { mapGetters } from 'vuex';

export default {
  name: 'ProfileOverview',
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
  computed: {
    ...mapGetters(['isAuthenticated', 'username']),
    ...mapGetters(['profile']),
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
