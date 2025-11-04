<template>
  <label class="c-input">
    <span v-if="label">{{ label }}</span>
    <input
      :type="type"
      :value="value"
      :placeholder="placeholder"
      @input="$emit('input', $event.target.value)"
    >
  </label>
</template>

<script>
export default {
  name: 'CInput',
  props: {
    value: {
      type: [String, Number],
      default: ''
    },
    label: {
      type: String,
      default: ''
    },
    placeholder: {
      type: String,
      default: ''
    },
    type: {
      type: String,
      default: 'text'
    }
  }
};
</script>

<style scoped>
.c-input {
  display: grid;
  gap: 0.35rem;
  color: #374151;
}

input {
  border: 1px solid #d1d5db;
  border-radius: 6px;
  padding: 0.65rem 0.75rem;
  font-size: 1rem;
}

input:focus {
  outline: none;
  border-color: #2563eb;
  box-shadow: 0 0 0 2px rgba(37, 99, 235, 0.25);
}
</style>
