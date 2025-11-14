<template>
  <div id="app" class="layout">
    <header class="layout__header">
      <h1 class="layout__title">Common Shell</h1>
      <nav class="layout__nav">
        <router-link to="/">Home</router-link>
        <router-link v-if="!isAuthenticated" to="/login">Login</router-link>
        <router-link v-if="isAuthenticated" to="/users">Users</router-link>
        <router-link v-if="isAuthenticated" to="/products">Product Search</router-link>
        <router-link v-if="isAuthenticated" to="/dashboard">Dashboard</router-link>
        <router-link v-if="isAuthenticated" to="/profile">Profile</router-link>
      </nav>
      <div class="layout__auth">
        <span v-if="isAuthenticated">Welcome, {{ username }}</span>
        <c-button v-if="!isAuthenticated" @click="simulateLogin">Login as Admin</c-button>
        <c-button
          v-else
          variant="secondary"
          @click="logout"
        >
          Logout
        </c-button>
      </div>
    </header>
    <main class="layout__main">
      <router-view />
      <section id="micro-app-container" class="micro-host" />
    </main>
  </div>
</template>

<script>
import { mapGetters } from 'vuex';
import { CButton } from 'mfe-components';

export default {
  name: 'App',
  components: {
    CButton
  },
  mixins: [],
  computed: {
    ...mapGetters(['isAuthenticated', 'username'])
  },
  methods: {
    simulateLogin() {
      const payload = {
        user: {
          name: 'Admin User',
          permissions: ['view-dashboard', 'edit-profile', 'manage-users'],
          lastLogin: new Date().toISOString()
        },
        token: 'demo-token-123'
      };
      this.unifiedLogin(payload);
      this.$router.push('/');
    },
    logout() {
      this.unifiedLogout();
      this.$router.push('/login');
    }
  },
  mounted() {
    if (this.user && this.token) {
      this.setGlobalState({
        user: this.user,
        token: this.token,
        lastLogin: this.user.lastLogin || null
      });
      this.syncAuthToLocalStorage();
    }
  }
};
</script>

<style scoped>
.layout {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  color: #2c3e50;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.layout__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem 1.5rem;
  background: #35495e;
  color: #fff;
}

.layout__title {
  margin: 0;
}

.layout__nav a {
  color: #fff;
  margin-right: 1rem;
  text-decoration: none;
}

.layout__nav a.router-link-exact-active {
  font-weight: bold;
  text-decoration: underline;
}

.layout__auth {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.layout__main {
  display: grid;
  grid-template-columns: 1fr;
  gap: 1.5rem;
  padding: 1.5rem;
  flex: 1;
  background: #f5f7fa;
}

.micro-host {
  min-height: 480px;
  background: #fff;
  border: 1px dashed #bfc3c9;
  border-radius: 8px;
  padding: 1rem;
}
</style>
