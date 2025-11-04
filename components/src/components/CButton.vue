<template>
  <button
    class="c-button"
    :class="`c-button--${variant}`"
    v-on="$listeners"
  >
    <slot />
  </button>
</template>

<script>
export default {
  name: 'CButton',
  props: {
    variant: {
      type: String,
      default: 'primary'
    }
  }
};
</script>

<style scoped>
.c-button {
  border: none;
  background: #2563eb;
  color: #fff;
  padding: 0.75rem 1.25rem;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 600;
  transition: background 0.2s ease-in-out;
}

.c-button:hover {
  background: #1d4ed8;
}

.c-button--secondary {
  background: #6b7280;
}

.c-button--secondary:hover {
  background: #4b5563;
}
</style>
