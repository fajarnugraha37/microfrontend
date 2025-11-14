<template>
  <div class="login-card">
    <form @submit.prevent="onLogin" class="login-form">
      <h2 class="login-title">Login</h2>
      <div class="login-field">
        <label for="username">Username</label>
        <input v-model="userNameInput" id="username" name="username" type="text" v-validate="'required|alpha_num'" data-vv-as="Username" class="login-input" />
        <span v-show="errors.has('username')" class="login-error">{{ errors.first('username') }}</span>
      </div>
      <div class="login-field">
        <label for="password">Password</label>
        <input v-model="passwordInput" id="password" name="password" type="password" v-validate="'required|min:8|validPassword'" data-vv-as="Password" class="login-input" autocomplete="new-password" />
        <span v-show="errors.has('password')" class="login-error">{{ errors.first('password') }}</span>
      </div>
      <button type="submit" class="login-btn">Login</button>
      <div v-if="error" class="login-error">{{ error }}</div>
    </form>
  </div>
</template>
<script>
import { AuthService } from '../services/auth';
import VeeValidate from 'vee-validate';
import '../validators';
export default {
  name: 'LoginForm',
  mounted() {
    if (!this.$validator) {
      this.$options._base.use(VeeValidate);
    }
  },
  data() {
    return {
      userNameInput: '',
      passwordInput: '',
      error: null,
    };
  },
  methods: {
    async onLogin() {
      const valid = await this.$validator.validateAll();
      if (!valid) return;
      try {
        const service = AuthService();
        const res = await service.login({ username: this.userNameInput, password: this.passwordInput });
        this.$emit('login-success', res.data);
        this.error = null;
      } catch (e) {
        this.error = e.response?.data?.message || 'Login failed';
      }
    }
  }
};
</script>

<style scoped>
.login-card {
  max-width: 400px;
  margin: 3rem auto;
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 2px 12px rgba(0,0,0,0.10);
  padding: 2rem 2rem 1.5rem 2rem;
  display: flex;
  flex-direction: column;
  align-items: center;
}
.login-form {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}
.login-title {
  text-align: center;
  font-size: 1.5rem;
  font-weight: 600;
  margin-bottom: 0.5rem;
  color: #35495e;
}
.login-field {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}
.login-input {
  padding: 0.75rem 1rem;
  border-radius: 8px;
  border: 1px solid #bfc3c9;
  font-size: 1rem;
  background: #f7f9fa;
  transition: border 0.2s;
}
.login-input:focus {
  border-color: #3498db;
  outline: none;
}
.login-btn {
  background: #3498db;
  color: #fff;
  border: none;
  border-radius: 8px;
  padding: 0.75rem 1.5rem;
  font-size: 1.1rem;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.2s;
}
.login-btn:hover {
  background: #217dbb;
}
.login-error {
  color: #e74c3c;
  text-align: center;
  margin-top: 0.5rem;
  font-size: 1rem;
}
</style>
