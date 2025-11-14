<template>
  <section class="micro-app-saas">
    <div class="micro-app-hero">
      <h1 class="micro-app-title">Microfrontend Host</h1>
      <p class="micro-app-subtitle">Seamlessly mount remote applications in your SaaS workspace.</p>
    </div>
    <div class="micro-app-info-cards">
      <div class="micro-app-info-card">
        <span class="micro-app-info-label">Current Route</span>
        <span class="micro-app-info-value">{{ $route.fullPath }}</span>
      </div>
      <div class="micro-app-info-card">
        <span class="micro-app-info-label">Mount Point</span>
        <span class="micro-app-info-value"><code>#micro-app-container</code></span>
      </div>
      <div class="micro-app-info-card">
        <span class="micro-app-info-label">Status</span>
        <span class="micro-app-info-value">Ready to render remote app</span>
      </div>
    </div>
    <slot />
  </section>
</template>

<script>
export default {
  name: 'MicroAppHost',
};
</script>

<style scoped>
.micro-app-saas {
  background: #fff;
  border-radius: 14px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.10);
  padding: 2rem 2rem 1.5rem 2rem;
  max-width: 900px;
  margin: 2rem auto;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.micro-app-hero {
  text-align: center;
  margin-bottom: 2rem;
}

.micro-app-title {
  font-size: 2rem;
  font-weight: 700;
  color: #35495e;
  margin-bottom: 0.5rem;
}

.micro-app-subtitle {
  color: #6b6f76;
  font-size: 1.1rem;
}

.micro-app-info-cards {
  display: flex;
  gap: 2rem;
  justify-content: center;
  flex-wrap: wrap;
  margin-bottom: 2rem;
}

.micro-app-info-card {
  background: #f7f9fa;
  border-radius: 10px;
  box-shadow: 0 1px 6px rgba(0, 0, 0, 0.07);
  padding: 1.25rem 1rem;
  min-width: 180px;
  max-width: 220px;
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 1rem;
}

.micro-app-info-label {
  font-size: 1rem;
  color: #35495e;
  font-weight: 600;
  margin-bottom: 0.25rem;
}

.micro-app-info-value {
  color: #3498db;
  font-size: 1.1rem;
  font-weight: 500;
}

.micro-app-host-area {
  width: 100%;
  min-height: 240px;
  border: 2px dashed #bfc3c9;
  border-radius: 10px;
  background: #f7f9fa;
  margin-top: 1.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
}
</style>
