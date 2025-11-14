<template>
  <section class="home-hero">
    <div class="home-hero-content">
      <h1 class="home-title">Welcome to Common Shell</h1>
      <p class="home-subtitle">Your unified SaaS workspace for microfrontends, authentication, and seamless integration.</p>
      <div class="home-actions">
        <router-link to="/dashboard" class="home-action-btn">Go to Dashboard</router-link>
        <router-link to="/profile" class="home-action-btn secondary">View Profile</router-link>
      </div>
    </div>
    <div class="home-features">
      <div class="feature-card">
        <h3>Authentication</h3>
        <p>Centralized login and user management for all microfrontends.</p>
      </div>
      <div class="feature-card">
        <h3>Microfrontend Integration</h3>
        <p>Mount remote apps like Dashboard and Profile with Qiankun.</p>
      </div>
      <div class="feature-card">
        <h3>Shared UI & Utilities</h3>
        <p>Reusable components and utilities for a consistent experience.</p>
      </div>
    </div>
  </section>
</template>

<script>
export default {
  name: 'HomeView'
};
</script>

<style scoped>
.home-hero {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 70vh;
  background: linear-gradient(90deg, #f5f7fa 0%, #eaf0fb 100%);
  padding: 2.5rem 1rem 2rem 1rem;
}
.home-hero-content {
  text-align: center;
  margin-bottom: 2.5rem;
}
.home-title {
  font-size: 2.5rem;
  font-weight: 700;
  color: #35495e;
  margin-bottom: 0.75rem;
}
.home-subtitle {
  font-size: 1.25rem;
  color: #6b6f76;
  margin-bottom: 1.5rem;
}
.home-actions {
  display: flex;
  gap: 1.25rem;
  justify-content: center;
  margin-bottom: 1rem;
}
.home-action-btn {
  background: #3498db;
  color: #fff;
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
  font-size: 1.1rem;
  font-weight: 500;
  text-decoration: none;
  box-shadow: 0 2px 8px rgba(52,152,219,0.08);
  transition: background 0.2s;
}
.home-action-btn.secondary {
  background: #27ae60;
}
.home-action-btn:hover {
  background: #217dbb;
}
.home-features {
  display: flex;
  gap: 2rem;
  justify-content: center;
  flex-wrap: wrap;
}
.feature-card {
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 2px 12px rgba(0,0,0,0.08);
  padding: 1.5rem 1.25rem;
  min-width: 220px;
  max-width: 320px;
  text-align: center;
  margin-bottom: 1rem;
}
.feature-card h3 {
  font-size: 1.15rem;
  color: #35495e;
  margin-bottom: 0.5rem;
}
.feature-card p {
  color: #6b6f76;
  font-size: 1rem;
}
</style>
