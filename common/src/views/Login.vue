
<template>
  <div>
    <h2>Login</h2>
    <LoginForm @login-success="onLoginSuccess" />
  </div>
</template>

<script>
import LoginForm from '../components/LoginForm.vue';
import { mapActions } from 'vuex';
import globalActions from '../state';

export default {
  name: 'LoginView',
  components: { LoginForm },
  methods: {
    ...mapActions(['login']),
    async onLoginSuccess(data) {
      // Store token and user in Vuex and global state
      const user = {
        name: data.user?.name || 'Demo User',
        permissions: data.user?.permissions || ['view-dashboard'],
        lastLogin: new Date().toISOString()
      };
      const token = data.token || 'demo-token';
      await this.login({ user, token });
      globalActions.setGlobalState({
        user,
        token,
        lastLogin: user.lastLogin
      });
      localStorage.setItem('auth_token', token);
      this.$router.push('/');
    }
  }
};
</script>
