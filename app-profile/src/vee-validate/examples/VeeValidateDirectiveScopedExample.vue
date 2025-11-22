<template>
  <!-- first form -->
  <form data-vv-scope="login1" @submit.prevent="onSubmitLogin1">
    <input type="text" name="username" v-validate="'required|alpha_num|min:3'" />
    <span v-if="errors.has('username', 'login1')">
      {{ errors.first('username', 'login1') }}
    </span>

    <input type="password" name="password" v-validate="'required|min:8'" />
    <span v-if="errors.has('password', 'login1')">
      {{ errors.first('password', 'login1') }}
    </span>

    <button type="submit">Login 1</button>
  </form>

  <!-- second form -->
  <form data-vv-scope="login2" @submit.prevent="onSubmitLogin2">
    <input type="text" name="username" v-validate="'required|alpha_num|min:3'" />
    <span v-if="errors.has('username', 'login2')">
      {{ errors.first('username', 'login2') }}
    </span>

    <input type="password" name="password" v-validate="'required|min:8'" />
    <span v-if="errors.has('password', 'login2')">
      {{ errors.first('password', 'login2') }}
    </span>

    <button type="submit">Login 2</button>
  </form>
</template>
<script>
export default {
  name: 'PageWithTwoForms',

  methods: {
    async onSubmitLogin1() {
      const ok = await this.$validator.validateAll('login1');
      if (!ok) return;
      // submit form 1 only
    },

    async onSubmitLogin2() {
      const ok = await this.$validator.validateAll('login2');
      if (!ok) return;
      // submit form 2 only
    },
  },
};

</script>