import Vue from 'vue';
import Router from 'vue-router';
import { routes } from './routes';

Vue.use(Router);

const router = new Router({
  mode: 'history',
  base: '/',
  routes: routes,
});


// Navigation guard for auth
router.beforeEach((to, from, next) => {
  const requiresAuth = to.matched.some(record => record.meta && record.meta.requiresAuth);
  const token = localStorage.getItem('auth_token');
  if (requiresAuth && !token) {
    next({ path: '/login', query: { redirect: to.fullPath } });
  } else {
    next();
  }
});

export default router;
