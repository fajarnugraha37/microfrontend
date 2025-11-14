<template>
  <div>
    <h2>Login</h2>
    <LoginForm @login-success="onLoginSuccess" />
  </div>
</template>
<script>
import LoginForm from '../components/LoginForm.vue';
export default {
  name: 'LoginPage',
  components: { LoginForm },
  methods: {
    onLoginSuccess(data) {
      localStorage.setItem('auth_token', data.token);
      this.$router.push('/');
    }
  }
};
</script>
