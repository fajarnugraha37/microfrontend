<template>
  <section class="home">
    <h2>Welcome to the Common Shell</h2>
    <p>
      Use the navigation links above to explore local pages and micro frontends.
      The Dashboard and Profile links mount remote applications powered by Qiankun.
    </p>
    <ul>
      <li>The shell manages authentication and passes it to child apps.</li>
      <li>Shared utilities are provided via Qiankun props.</li>
      <li>Shared UI components are imported from the components library.</li>
    </ul>
  </section>
</template>

<script>
export default {
  name: 'HomeView'
};
</script>

<style scoped>
.home {
  background: #fff;
  border-radius: 8px;
  padding: 1.5rem;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.08);
}

.home ul {
  margin-top: 1rem;
  padding-left: 1.25rem;
}
</style>
