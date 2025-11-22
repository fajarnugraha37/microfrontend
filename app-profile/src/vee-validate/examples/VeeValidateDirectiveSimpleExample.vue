<template>
  <div>
    <input
      type="text"
      name="email"
      v-validate="'required|email'"
    />
    <span v-if="errors.has('email')">
      {{ errors.first('email') }}
    </span>
  </div>
</template>

<script>
export default {
  name: 'EmailField',
  // `errors` comes from globalProperties via plugin
};
</script>
