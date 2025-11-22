<template>
  <Field
    v-slot="fieldSlot"
    :name="fieldName"
    :rules="rules"
    :validate-on-mount="immediate"
    :bails="bails"
  >
    <slot v-bind="buildSlotProps(fieldSlot)" />
  </Field>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { Field, type FieldSlotProps } from 'vee-validate';

export interface ValidationProviderSlotProps {
  // vee-validate 2-ish
  errors: string[];
  error?: string;

  valid: boolean;
  invalid: boolean;

  dirty: boolean;
  pristine: boolean;

  touched: boolean;
  untouched: boolean;

  value: unknown;

  // event helpers
  onInput: (e: Event | unknown) => void;
  onBlur: (e: FocusEvent | unknown) => void;

  // misc helpers
  reset: () => void;
  setTouched: (touched: boolean) => void;
}

const props = defineProps<{
  name?: string;
  rules?:
    | string
    | Record<string, any>
    | ((value: unknown, ctx: any) => any);
  vid?: string;
  immediate?: boolean;
  bails?: boolean;
  skipIfEmpty?: boolean;
}>();

defineSlots<{
  default(props: ValidationProviderSlotProps): any;
}>();

// keep latest fieldSlot so we can expose validate/reset via $refs
const lastSlot = ref<FieldSlotProps<any> | null>(null);

// computed field name (vid has priority like v2)
const fieldName = computed(() => props.vid || props.name || '');

// dev-time guard
if (import.meta.env.DEV && !fieldName.value) {
  // eslint-disable-next-line no-console
  console.warn(
    '[ValidationProvider] name or vid is required for proper behavior.'
  );
}

function buildSlotProps(
  fieldSlot: FieldSlotProps<any>
): ValidationProviderSlotProps {
  lastSlot.value = fieldSlot;

  const meta = fieldSlot.meta ?? {};
  const errors = fieldSlot.errors ?? [];

  return {
    errors,
    error: fieldSlot.errorMessage || undefined,

    valid: meta.valid === true,
    invalid: meta.valid === false,

    dirty: !!meta.dirty,
    pristine: !meta.dirty,

    touched: !!meta.touched,
    untouched: !meta.touched,

    value: fieldSlot.value,

    onInput: (e: any) => {
      fieldSlot.handleChange(e);
    },
    onBlur: (e: any) => {
      fieldSlot.handleBlur(e);
    },

    reset: fieldSlot.resetField ?? (() => {}),
    setTouched: fieldSlot.setTouched ?? (() => {}),
  };
}

// ---- exposed API for $refs.provider ----

// mimic v2-style: this.$refs.provider.validate(value?)
async function validateExposed(value?: unknown): Promise<{
  valid: boolean;
  errors: string[];
}> {
  const slot = lastSlot.value;
  if (!slot?.validate) {
    return { valid: true, errors: [] };
  }

  // vee-validate v4 validate returns { valid, errors, ... }
  const res = await slot.validate(value as any);
  return {
    valid: !!res.valid,
    errors: (res.errors as string[]) || [],
  };
}

// mimic v2-style: this.$refs.provider.reset()
function resetExposed(): void {
  const slot = lastSlot.value;
  slot?.resetField?.();
}

defineExpose({
  validate: validateExposed,
  reset: resetExposed,
});
</script>
