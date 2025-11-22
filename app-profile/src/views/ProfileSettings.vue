<template>
  <article class="profile-settings">
    <h3>Profile Settings</h3>
    <Questionnaire />
    <p v-if="savedAt" class="profile-settings__status">
      Saved at {{ formatted(savedAt) }}
    </p>
  </article>
</template>

<script>
import { CButton } from 'mfe-components';
import { useProfileStore } from '../store';
import Questionnaire from '../components/Questionnaire.vue';

export default {
  name: 'ProfileSettings',
  components: {
    CButton,
    Questionnaire
  },
  props: {
    sharedShell: {
      type: Object,
      default: () => ({})
    },
    sharedUtils: {
      type: Object,
      default: () => ({})
    },
    pushSharedState: {
      type: Function,
      default: null
    }
  },
  data() {
    return {
      useProfileStore: useProfileStore(),
      useBridgeStore: this.$bridgeStore(),
      useAuth: this.$derivedStore.auth(),
      form: {
        bio: '',
        interests: ''
      },
      savedAt: null
    };
  },
  computed: {
    profile() {
      return this.useProfileStore.profile;
    }
  },
  created() {
    this.form.bio = this.profile.bio;
    this.form.interests = this.profile.interests.join(', ');
  },
  methods: {
    saveProfile(partial) {
      this.useProfileStore.$patch({
        profile: {
          ...this.useProfileStore.profile,
          ...partial
        }
      });
    },
    save() {
      const interests = this.form.interests
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean);

      this.saveProfile({
        bio: this.form.bio,
      interests
    });

    this.savedAt = new Date();

    if (typeof this.pushSharedState === 'function') {
      this.pushSharedState({
        profilePreferences: {
          bio: this.form.bio,
          interests
        }
      });
      }
    },
    formatted(date) {
      return this.sharedUtils.formatDate
        ? this.sharedUtils.formatDate(date)
        : date.toString();
    }
  }
};
</script>

<style scoped>
.profile-settings {
  display: grid;
  gap: 1.5rem;
}

form {
  display: grid;
  gap: 1rem;
}

label {
  display: grid;
  gap: 0.5rem;
}

.profile-settings__status {
  color: #2563eb;
  font-weight: 600;
}
</style>
