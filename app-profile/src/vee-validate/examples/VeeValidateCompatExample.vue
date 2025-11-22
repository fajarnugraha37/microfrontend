<template>
  <ValidationObserver v-slot="{ invalid, validate, reset }">
    <form @submit.prevent="validate(onSubmit)">
      <ValidationProvider name="email" rules="required|email" v-slot="{ errors, onInput }">
        <input type="text" @input="e => { onInput(e); form.email = e.target.value; }" />
        <span>{{ errors[0] }}</span>
      </ValidationProvider>

      <button type="submit" :disabled="invalid">submit</button>
      <button type="button" @click="reset">reset</button>
    </form>
  </ValidationObserver>
</template>

<script>
import ValidationObserver from '../ValidationObserver.vue';
import ValidationProvider from '../ValidationProvider.vue';

export default {
  components: {
    ValidationObserver,
    ValidationProvider,
  },
  data() {
    return {
      form: { email: '' },
    };
  },
  methods: {
    async onSubmit() {
      // do your thing
    },
  },
};
</script>