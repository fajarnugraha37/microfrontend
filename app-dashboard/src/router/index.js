import Vue from 'vue';
import Router from 'vue-router';
import DashboardHome from '../views/DashboardHome.vue';
import DashboardDetails from '../views/DashboardDetails.vue';
import DashboardSettings from '../views/DashboardSettings.vue';

Vue.use(Router);

const base = window.singleSpaNavigate ? '/dashboard' : '/';

const router = new Router({
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
