import { defineStore } from "pinia";
import { ref, computed } from "vue";

export const useProfileStore = defineStore("profile", () => {
  // State
  const profile = ref({
    bio: 'Front-end engineer passionate about microfrontends.',
    interests: ['Vue.js', 'Qiankun', 'Design Systems']
  });

  const sharedShell = ref({});

  // Actions
  const updateBio = (bio) => {
    profile.value.bio = bio;
  };

  const updateInterests = (interests) => {
    profile.value.interests = interests;
  };

  const saveProfile = (payload) => {
    updateBio(payload.bio);
    updateInterests(payload.interests);
  };

  const replaceSharedShell = (payload) => {
    sharedShell.value = { ...payload };
  };

  const setSharedShell = (payload) => {
    replaceSharedShell(payload);
  };

  // Getters
  const sharedUser = computed(() =>
    sharedShell.value && sharedShell.value.user ? sharedShell.value.user : null
  );

  return {
    profile,
    sharedShell,
    updateBio,
    updateInterests,
    saveProfile,
    replaceSharedShell,
    setSharedShell,
    sharedUser
  };
});

export const store = {
  /**
   * @param {import('pinia').Pinia} pinia 
   */
  attachModule: (pinia) => {
    store.value = pinia;
  },
  /**
   * @param {import('pinia').Pinia} pinia 
   */
  detachModule: (pinia) => {
    store.value = null;
  },
  value: null
};

export default store;