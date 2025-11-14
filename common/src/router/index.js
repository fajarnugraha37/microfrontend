
import { routes } from './routes';

export const useRouter = (vue) => {
  vue.use(window.VueRouter);
  const router = new window.VueRouter({
    mode: 'history',
    base: '/',
    routes: routes,
  });


  // Navigation guard for auth
  router.beforeEach((to, from, next) => {
    const requiresAuth = to.matched.some(record => record.meta && record.meta.requiresAuth);
    // Use Vuex store for token retrieval
    let token = null;
    if (router.app && router.app.$store) {
      token = router.app.$store.state.token || null;
    }
    if (!token && typeof window !== 'undefined') {
      token = window.localStorage.getItem('auth_token');
    }
    if (requiresAuth && !token) {
      next({ path: '/login', query: { redirect: to.fullPath } });
    } else {
      next();
    }
  });

  window.router = router;
}