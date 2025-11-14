import DashboardHome from '../views/DashboardHome.vue';
import DashboardDetails from '../views/DashboardDetails.vue';
import DashboardSettings from '../views/DashboardSettings.vue';

window.Vue.use(window.VueRouter);

const base = window.__POWERED_BY_QIANKUN__ ? '/dashboard' : '/';

const router = new window.VueRouter({
  mode: 'history',
  base,
  routes: [
    {
      path: '/',
      name: 'dashboard-home',
      component: DashboardHome
    },
    {
      path: '/details',
      name: 'dashboard-details',
      component: DashboardDetails
    },
    {
      path: '/settings',
      name: 'dashboard-settings',
      component: DashboardSettings
    }
  ]
});

export default router;
