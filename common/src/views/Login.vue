
<template>
  <div>
    <h2>Login</h2>
    <LoginForm @login-success="onLoginSuccess" />
  </div>
</template>

<script>
import LoginForm from '../components/LoginForm.vue';
import { mapActions } from 'vuex';

export default {
  name: 'LoginView',
  components: { LoginForm },
  mixins: [],
  methods: {
    ...mapActions(['login']),
    async onLoginSuccess(data) {
      // Store token and user in Vuex and global state using mixin
      const user = {
        name: data.user?.name || 'Demo User',
        permissions: data.user?.permissions || ['view-dashboard'],
        lastLogin: new Date().toISOString()
      };
      const token = data.token || 'demo-token';
      this.unifiedLogin({ user, token });
      this.$router.push('/');
    }
  }
};
</script>
