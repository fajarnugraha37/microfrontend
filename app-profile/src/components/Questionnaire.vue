<template>
  <section class="questionnaire-card">
    <h3>Profile Questionnaire</h3>
    <Form :initial-values="initialValues" @submit="onSubmit">
      <div class="form-grid">
        <label class="form-label">Name</label>
        <div>
          <Field name="name" as="input" class="form-input" rules="required|min:2" label="Name"/>
          <ErrorMessage name="name" class="form-error" />
        </div>

        <label class="form-label">Email</label>
        <div>
          <Field name="email" as="input" class="form-input" rules="required|email" label="Email"/>
          <ErrorMessage name="email" class="form-error" />
        </div>

        <label class="form-label">Bio</label>
        <div>
          <Field name="bio" as="textarea" class="form-textarea" rules="max:200" label="Bio" />
          <ErrorMessage name="bio" class="form-error" />
          <div class="hint">Keep it under 200 characters.</div>
        </div>

        <label class="form-label">NRIC</label>
        <div>
          <Field name="nric" as="input" class="form-input" rules="nric" label="NRIC" />
          <ErrorMessage name="nric" class="form-error" />
        </div>

        <label class="form-label">FIN</label>
        <div>
          <Field name="fin" as="input" class="form-input" rules="fin" label="FIN" />
          <ErrorMessage name="fin" class="form-error" />
        </div>

        <label class="form-label">UEN</label>
        <div>
          <Field name="uen" as="input" class="form-input" rules="uen" label="UEN" />
          <ErrorMessage name="uen" class="form-error" />
        </div>

        <label class="form-label">Interests</label>
        <div>
          <div class="interests">
            <label v-for="(interest, idx) in interestOptions" :key="interest" class="interest-item">
              <Field name="interests" type="checkbox" :value="interest" :rules="idx === 0 ? 'required' : ''" />
              <span>{{ interest }}</span>
            </label>
          </div>
          <div class="custom-interest">
            <input v-model="customInterest" placeholder="Add custom interest" class="form-input" />
            <button type="button" class="btn small" @click="addCustomInterest">Add</button>
          </div>
          <ErrorMessage name="interests" class="form-error" />
        </div>

        <label class="form-label">Agree to Terms</label>
        <div>
          <label class="terms">
            <Field name="terms" type="checkbox" :value="true" rules="required" label="Terms" />
            I agree to the terms of this app.
          </label>
          <ErrorMessage name="terms" class="form-error" />
        </div>
      </div>

      <div class="form-actions">
        <button type="submit" class="btn primary">Save Profile</button>
        <button type="reset" @click="onReset" class="btn">Reset</button>
      </div>
    </Form>

    <div v-if="successMessage" class="success">{{ successMessage }}</div>
  </section>
</template>

<script setup>
import { ref, computed, watch } from 'vue';
import { Form, Field, ErrorMessage, defineRule } from 'vee-validate';
import { required, email, min, max } from '@vee-validate/rules';
import { useProfileStore } from '@/store';

// Register common rules locally (safe even if registered globally elsewhere)
defineRule('required', required);
defineRule('email', email);
defineRule('min', min);
defineRule('max', max);

// Improve validation messages and avoid non-descriptive defaults
// configure({
//   generateMessage: (ctx) => {
//     const fieldName = typeof ctx.field === 'string' ? ctx.field : (ctx.field?.name || 'Field');
//     const rule = ctx.rule?.name;
//     const params = ctx.rule?.params || [];
//     if (rule === 'required') return `${fieldName} is required`;
//     if (rule === 'email') return `${fieldName} must be a valid email address`;
//     if (rule === 'min') return `${fieldName} must be at least ${params[0] || ''} characters`;
//     if (rule === 'max') return `${fieldName} must be less than or equal to ${params[0] || ''} characters`;
//     return `${fieldName} is not valid`;
//   },
// });

// Local rules for NRIC/FIN/UEN — if they are already registered globally this is harmless
// defineRule('nric', (value) => {
//   if (!value) return true;
//   // Basic Singapore NRIC/FIN structure: starts with S/T/F/G and 7 digits + trailing letter
//   const re = /^[STFG]\d{7}[A-Z]$/i;
//   return re.test(value) || 'NRIC format is invalid';
// });
// defineRule('fin', (value) => {
//   if (!value) return true;
//   // FIN often begins with F or G followed by 7 digits and a trailing letter
//   const re = /^[FG]\d{7}[A-Z]$/i;
//   return re.test(value) || 'FIN format is invalid';
// });
// defineRule('uen', (value) => {
//   if (!value) return true;
//   // Simple UEN pattern: 9-10 alphanumeric characters
//   const re = /^[A-Z0-9]{9,10}$/i;
//   return re.test(value) || 'UEN format is invalid';
// });

const profileStore = useProfileStore();

const interestOptions = ref(['Vue.js', 'Qiankun', 'Design Systems']);
const customInterest = ref('');
const successMessage = ref('');

const initialValues = computed(() => ({
  name: profileStore.profile?.name || '',
  email: profileStore.profile?.email || '',
  bio: profileStore.profile?.bio || '',
  nric: profileStore.profile?.nric || '',
  fin: profileStore.profile?.fin || '',
  uen: profileStore.profile?.uen || '',
  interests: profileStore.profile?.interests || [],
  terms: !!profileStore.profile?.terms,
}));

const onSubmit = (values, { resetForm }) => {
  // Persist bio + interests to profile store
  profileStore.saveProfile({
    bio: values.bio,
    interests: values.interests,
    nric: values.nric,
    fin: values.fin,
    uen: values.uen,
    name: values.name,
    email: values.email,
    terms: values.terms,
  });
  successMessage.value = 'Profile saved successfully!';
  setTimeout(() => (successMessage.value = ''), 3500);
};

const addCustomInterest = () => {
  const trimmed = (customInterest.value || '').trim();
  if (trimmed && !interestOptions.value.includes(trimmed)) {
    // Add to local options so it immediately appears
    interestOptions.value.push(trimmed);
    // Also update the stored interests immutably so pinia change detection persists it
    const currentInterests = profileStore.profile?.interests || [];
    profileStore.updateInterests([...currentInterests, trimmed]);
    customInterest.value = '';
  }
};

// Ensure the current stored interests are present in the options list (e.g. when returning to the page)
watch(
  () => profileStore.profile?.interests,
  (newInterests) => {
    if (Array.isArray(newInterests)) {
      newInterests.forEach((i) => {
        if (i && !interestOptions.value.includes(i)) {
          interestOptions.value.push(i);
        }
      });
    }
  },
  { immediate: true }
);

const onReset = (evt) => {
  // Reset to store values
  evt.preventDefault();
  // DO NOT mutate form values directly; reset will be handled by VeeValidate's reset when used
  // Instead, call a small timed reset — this keeps initial values sourced from the store
  setTimeout(() => {
    // nothing additional required because form reset will revert to initialValues
  });
};
</script>

<style scoped>
.questionnaire-card {
  background: #fff;
  border-radius: 12px;
  padding: 1.25rem 1.5rem;
  box-shadow: 0 8px 40px rgba(16, 24, 40, 0.06);
  max-width: 760px;
}
.questionnaire-card h3 {
  margin: 0 0 1rem 0;
  font-size: 1.25rem;
}
.form-grid {
  display: grid;
  grid-template-columns: 140px 1fr;
  gap: 0.75rem 1.25rem;
  align-items: start;
}
.form-label {
  padding-top: 0.5rem;
  color: #344054;
  font-weight: 600;
}
.form-input, .form-textarea {
  width: 100%;
  border: 1px solid #e6e9ef;
  padding: 0.5rem 0.75rem;
  border-radius: 8px;
}
.form-textarea { min-height: 84px; resize: vertical; }
.form-error { color: #ef4444; font-size: 0.875rem; margin-top: 0.25rem; }
.hint { color: #667085; font-size: 0.85rem; margin-top: 0.25rem; }
.interests { display: flex; gap: 0.5rem; flex-wrap: wrap; }
.interest-item { display: inline-flex; gap: 0.5rem; align-items: center; }
.custom-interest { display:flex; gap: 0.5rem; margin-top: 0.5rem; align-items:center; }
.terms { display:inline-flex; gap: 0.5rem; align-items:center; }
.form-actions { margin-top: 1rem; display:flex; gap: 0.5rem; }
.btn { border-radius: 8px; padding: 0.5rem 0.85rem; border: none; cursor: pointer; background: #eef2ff; color: #1e293b; }
.btn.primary { background: #7c3aed; color: #fff; }
.btn.small { padding: 0.35rem 0.6rem; font-size: 0.9rem; }
.success { margin-top: 1rem; color: #16a34a; font-weight: 600; }
</style>
