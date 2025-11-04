<template>
  <section class="login">
    <h2>Shell Login</h2>
    <form @submit.prevent="submit">
      <c-input
        label="Name"
        placeholder="Jane Doe"
        v-model="form.name"
      />
      <c-input
        label="Permission (comma separated)"
        placeholder="view-dashboard,edit-profile"
        v-model="form.permissions"
      />
      <c-input
        label="Token"
        placeholder="token-123"
        v-model="form.token"
      />
      <c-button type="submit">Simulate Login</c-button>
    </form>
    <p class="hint">
      This form stores authentication data in the shell Vuex store and propagates it to
      child applications via Qiankun global state.
    </p>
  </section>
</template>

<script>
import { mapActions } from 'vuex';
import globalActions from '../state';
import { CButton, CInput } from 'mfe-components';

export default {
  name: 'LoginView',
  components: {
    CButton,
    CInput
  },
  data() {
    return {
      form: {
        name: '',
        permissions: '',
        token: ''
      }
    };
  },
  methods: {
    ...mapActions(['login']),
    submit() {
      const user = {
        name: this.form.name || 'Demo User',
        permissions: this.form.permissions
          ? this.form.permissions.split(',').map((item) => item.trim())
          : ['view-dashboard'],
        lastLogin: new Date().toISOString()
      };

      const token = this.form.token || 'demo-token';

      this.login({ user, token });
      globalActions.setGlobalState({
        user,
        token,
        lastLogin: user.lastLogin
      });

      this.$router.push('/');
    }
  }
};
</script>

<style scoped>
.login {
  background: #fff;
  border-radius: 8px;
  padding: 1.5rem;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.08);
  max-width: 420px;
}

form {
  display: grid;
  gap: 1rem;
}

.hint {
  margin-top: 1rem;
  color: #6b6f76;
  font-size: 0.9rem;
}
</style>
