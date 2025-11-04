<template>
  <section class="micro-app-host">
    <h2>Micro App Host</h2>
    <p>The remote microfrontend will render below inside the dashed area.</p>
    <p class="micro-app-host__hint">
      Route: <strong>{{ $route.fullPath }}</strong>
    </p>
    <p>
      Mount Point: <code>#micro-app-container</code>
    </p>
  </section>
</template>

<script>
export default {
  name: 'MicroAppHost'
};
</script>

<style scoped>
.micro-app-host {
  background: #fff;
  border-radius: 8px;
  padding: 1.5rem;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.08);
}

.micro-app-host__hint {
  color: #6b6f76;
}
</style>
