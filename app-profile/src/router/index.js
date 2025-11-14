import { createRouter, createWebHistory } from 'vue-router';
import ProfileOverview from '../views/ProfileOverview.vue';
import ProfileActivity from '../views/ProfileActivity.vue';
import ProfileSettings from '../views/ProfileSettings.vue';

const routes = [
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
];

const getBase = () => (window.singleSpaNavigate ? '/profile' : '/');

export const createRouterInstance = () =>
  createRouter({
    history: createWebHistory(getBase()),
    routes
  });

export default createRouterInstance;
