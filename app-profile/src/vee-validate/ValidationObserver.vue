<template>
  <Form v-slot="formSlot" :as="slim ? 'span' : tag">
    <slot v-bind="buildObserverSlotProps(formSlot)" />
  </Form>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { Form, type FormSlotProps } from 'vee-validate';

export interface ValidationObserverSlotProps<TValues = Record<string, any>> {
  invalid: boolean;
  valid: boolean;

  dirty: boolean;
  pristine: boolean;

  touched: boolean;
  untouched: boolean;

  pending: boolean;

  errors: Record<string, string | string[]>;
  meta: FormSlotProps['meta'];

  validate: (cb?: (values: TValues) => any | Promise<any>) => Promise<boolean>;
  reset: () => void;
  passes: (cb: (values: TValues) => any | Promise<any>) => Promise<void>;
  fails: (cb: (errors: Record<string, any>) => any | Promise<any>) => Promise<void>;
}

const props = defineProps<{
  tag?: string;
  slim?: boolean;
  disabled?: boolean;
}>();

defineSlots<{
  default(props: ValidationObserverSlotProps): any;
}>();

const lastFormSlot = ref<FormSlotProps | null>(null);

function makeSlotProps(
  formSlot: FormSlotProps
): ValidationObserverSlotProps {
  const meta = formSlot.meta ?? {};
  const errors = (formSlot.errors as any) ?? {};
  const values = (formSlot.values as any) ?? {};

  // ✅ safer invalid detection: at least one non-empty error array
  const hasErrors = Object.values(errors).some(
    (val) => Array.isArray(val) && val.length > 0
  );

  // NOTE: we accept both validate(), validate(cb) and tolerate validate({ silent: true })
  const validateImpl: ValidationObserverSlotProps['validate'] = async (
    arg?: any
  ) => {
    const cb = typeof arg === 'function' ? arg : undefined;
    const opts =
      arg && typeof arg === 'object' && !Array.isArray(arg) ? arg : undefined;

    // v4 Form.validate() has no "silent" feature, so we just ignore opts.silent
    if (props.disabled || !formSlot.validate) {
      if (cb) await cb(values);
      return true;
    }

    const res = await formSlot.validate();
    const ok = !!res.valid;

    if (ok && cb) {
      await cb(values);
    }

    return ok;
  };

  const resetImpl: ValidationObserverSlotProps['reset'] = () => {
    formSlot.resetForm?.();
  };

  const passesImpl: ValidationObserverSlotProps['passes'] = async (cb) => {
    const ok = await validateImpl();
    if (ok) {
      await cb(values);
    }
  };

  const failsImpl: ValidationObserverSlotProps['fails'] = async (cb) => {
    if (!formSlot.validate) return;
    const res = await formSlot.validate();
    if (!res.valid) {
      await cb(res.errors || {});
    }
  };

  return {
    invalid: hasErrors,
    valid: !hasErrors,

    dirty: !!meta.dirty,
    pristine: !meta.dirty,

    touched: !!meta.touched,
    untouched: !meta.touched,

    pending: !!meta.pending,

    errors,
    meta,

    validate: validateImpl,
    reset: resetImpl,
    passes: passesImpl,
    fails: failsImpl,
  };
}

function buildObserverSlotProps(
  formSlot: FormSlotProps
): ValidationObserverSlotProps {
  // keep latest form slot so $refs.observer.validate() works
  lastFormSlot.value = formSlot;
  return makeSlotProps(formSlot);
}

// ✅ v2-style ref usage: this.$refs.observer.validate() / reset()
async function validateExposed(arg?: any): Promise<boolean> {
  if (!lastFormSlot.value) return true;
  return makeSlotProps(lastFormSlot.value).validate(arg as any);
}

function resetExposed() {
  if (!lastFormSlot.value) return;
  makeSlotProps(lastFormSlot.value).reset();
}

defineExpose({
  validate: validateExposed,
  reset: resetExposed,
});
</script>
