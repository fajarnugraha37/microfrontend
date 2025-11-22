import { createRouter, createWebHistory } from 'vue-router';
import ProfileOverview from '../views/ProfileOverview.vue';
import ProfileActivity from '../views/ProfileActivity.vue';
import ProfileSettings from '../views/ProfileSettings.vue';

const base = '/profile';

const router = new createRouter({
  history: createWebHistory(base),
  routes: [
    {
      path: '/',
      name: 'profile-overview',
      component: ProfileOverview
    },
    {
      path: '/activity',
      name: 'profile-activity',
      component: ProfileActivity
    },
    {
      path: '/settings',
      name: 'profile-settings',
      component: ProfileSettings
    }
  ]
});

export default router;
