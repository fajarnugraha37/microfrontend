import Vue from 'vue';
import Router from 'vue-router';
import { routes } from './routes';

Vue.use(Router);

const router = new Router({
  mode: 'history',
  base: '/',
  routes: routes,
});

export default router;
