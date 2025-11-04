<template>
  <article class="dashboard-settings">
    <h3>Personalisation</h3>
    <p v-if="user">
      Update dashboard preferences for <strong>{{ user.name }}</strong>.
    </p>
    <p v-else>
      Login from the shell to personalise your experience.
    </p>
    <form @submit.prevent="save">
      <label class="setting">
        <span>Receive weekly digest</span>
        <input v-model="form.weeklyDigest" type="checkbox">
      </label>
      <label class="setting">
        <span>Enable beta widgets</span>
        <input v-model="form.betaWidgets" type="checkbox">
      </label>
      <c-button type="submit">Save preferences</c-button>
    </form>
    <p v-if="savedMessage" class="dashboard-settings__status">
      {{ savedMessage }}
    </p>
  </article>
</template>

<script>
import { CButton } from 'mfe-components';

export default {
  name: 'DashboardSettings',
  components: {
    CButton
  },
  props: {
    user: {
      type: Object,
      default: null
    },
    setGlobalState: {
      type: Function,
      default: null
    }
  },
  data() {
    return {
      form: {
        weeklyDigest: true,
        betaWidgets: false
      },
      savedMessage: ''
    };
  },
  methods: {
    save() {
      if (typeof this.setGlobalState === 'function') {
        this.setGlobalState({
          dashboardPreferences: { ...this.form }
        });
      }

      this.savedMessage = 'Preferences synced to shell at ' + new Date().toLocaleTimeString();
    }
  }
};
</script>

<style scoped>
.dashboard-settings {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.setting {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: #f3f4f6;
  padding: 0.75rem 1rem;
  border-radius: 6px;
}

.dashboard-settings__status {
  color: #047857;
  font-weight: 600;
}
</style>
