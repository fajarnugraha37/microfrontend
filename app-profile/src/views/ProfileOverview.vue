<template>
  <article class="profile-overview">
    <h3>Overview</h3>
    <p v-if="isAuthenticated">
      <strong>{{ username }}</strong>'s profile. 
    </p>
    <p v-else>
      Login from the shell to load profile data.
    </p> 
    <LoginForm />
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
    <hr />
    <section>
      <h4>Update Profile</h4>
      <Questionnaire />
    </section>
    <hr />
    <section>
      <c-button>Notify Shell About Activity</c-button>
    </section>
  </article>
</template>

<script>
import { CButton } from 'mfe-components';
import { useProfileStore } from '../store';
import Questionnaire from '../components/Questionnaire.vue';

export default {
  name: 'ProfileOverview',
  components: {
    CButton,
    Questionnaire,
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
  },
  methods: {
    onLoginSuccess(data) {
      console.log('Login successful:', data);
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
