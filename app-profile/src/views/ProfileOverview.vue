<template>
  <article class="profile-overview">
    <h3>Overview</h3>
    <p v-if="user">
      <strong>{{ user.name }}</strong>'s profile. Last login:
      <span v-if="sharedUtils.formatDate">
        {{ sharedUtils.formatDate(user.lastLogin || new Date()) }}
      </span>
      <span v-else>{{ user.lastLogin }}</span>
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
    user: {
      type: Object,
      default: null
    },
    sharedUtils: {
      type: Object,
      default: () => ({})
    }
  },
  computed: {
    ...mapGetters(['profile'])
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
