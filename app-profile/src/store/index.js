import { defineStore } from "pinia";
import { ref, computed } from "vue";

export const useProfileStore = defineStore("profile", () => {
  // State
  const profile = ref({
    bio: 'Front-end engineer passionate about microfrontends.',
    interests: ['Vue.js', 'Qiankun', 'Design Systems'],
    nric: '',
    fin: '',
    uen: ''
  });

  const sharedShell = ref({});

  // Actions
  const updateBio = (bio) => {
    profile.value.bio = bio;
  };

  const updateInterests = (interests) => {
    profile.value.interests = interests;
  };

  const updateNric = (nric) => {
    profile.value.nric = nric;
  };

  const updateFin = (fin) => {
    profile.value.fin = fin;
  };

  const updateUen = (uen) => {
    profile.value.uen = uen;
  };

  const saveProfile = (payload) => {
    updateBio(payload.bio);
    updateInterests(payload.interests);
    if (payload.nric !== undefined) updateNric(payload.nric);
    if (payload.fin !== undefined) updateFin(payload.fin);
    if (payload.uen !== undefined) updateUen(payload.uen);
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
    updateNric,
    updateFin,
    updateUen,
    saveProfile,
    replaceSharedShell,
    setSharedShell,
    sharedUser
  };
}, {
  persist: {
    key: 'app-profile.profile',
    debug: true,
    storage: localStorage,
    beforeHydrate: (context) => {
      console.log('[Pinia PersistedState] beforeHydrate', context);
    },
    afterHydrate: (context) => {
      console.log('[Pinia PersistedState] afterHydrate', context);
    },
  },
});

export default {
  useProfileStore,
};