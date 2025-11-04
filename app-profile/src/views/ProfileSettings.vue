<template>
  <article class="profile-settings">
    <h3>Profile Settings</h3>
    <form @submit.prevent="save">
      <label>
        <span>Bio</span>
        <textarea v-model="form.bio" rows="3"></textarea>
      </label>
      <label>
        <span>Interests (comma separated)</span>
        <input v-model="form.interests" type="text">
      </label>
      <c-button type="submit">Save Profile</c-button>
    </form>
    <p v-if="savedAt" class="profile-settings__status">
      Saved at {{ formatted(savedAt) }}
    </p>
  </article>
</template>

<script>
import { mapGetters, mapActions } from 'vuex';
import { CButton } from 'mfe-components';

export default {
  name: 'ProfileSettings',
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
    },
    pushSharedState: {
      type: Function,
      default: null
    }
  },
  data() {
    return {
      form: {
        bio: '',
        interests: ''
      },
      savedAt: null
    };
  },
  computed: {
    ...mapGetters(['profile'])
  },
  created() {
    this.form.bio = this.profile.bio;
    this.form.interests = this.profile.interests.join(', ');
  },
  methods: {
    ...mapActions(['saveProfile']),
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
