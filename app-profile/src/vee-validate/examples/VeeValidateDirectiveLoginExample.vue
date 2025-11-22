<template>
  <form @submit.prevent="onSubmit">
    <input
      type="text"
      name="username"
      v-validate="'required|alpha_num|min:3'"
    />
    <span v-if="errors.has('username')">
      {{ errors.first('username') }}
    </span>

    <input
      type="password"
      name="password"
      v-validate="'required|min:8'"
    />
    <span v-if="errors.has('password')">
      {{ errors.first('password') }}
    </span>

    <button type="submit">Login</button>
  </form>
</template>

<script>
export default {
  name: 'LoginForm',

  data() {
    return {
      // your own form model if you want
      username: '',
      password: '',
    };
  },

  methods: {
    async onSubmit() {
      // this.$validator from plugin
      const ok = await this.$validator.validateAll();
      if (!ok) return;

      // do real login stuff here
      console.log('submit ok');
    },
  },
};
</script>
