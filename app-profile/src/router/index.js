import ProfileOverview from '../views/ProfileOverview.vue';
import ProfileActivity from '../views/ProfileActivity.vue';
import ProfileSettings from '../views/ProfileSettings.vue';

window.Vue.use(window.VueRouter);

const base = window.__POWERED_BY_QIANKUN__ ? '/profile' : '/';

const router = new window.VueRouter({
  mode: 'history',
  base,
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
