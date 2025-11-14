import Home from '../views/Home.vue';
import Login from '../views/Login.vue';
import Users from '../views/Users.vue';
import ProductView from '../views/ProductView.vue';
import MicroAppHost from '../modules/MicroAppHost.vue';

/** @type {import('vue-router').RouteConfig[]} */
export const routes = [
  {
    path: '/',
    name: 'home',
    component: Home
  },
  {
    path: '/login',
    name: 'login',
    component: Login
  },
  {
    path: '/users',
    name: 'users',
    component: Users,
    meta: { requiresAuth: true }
  },
  {
    path: '/products',
    name: 'products',
    component: ProductView
  },
  {
    path: '/products/:id',
    name: 'product-detail',
    component: ProductView
  },
  {
    path: '/dashboard',
    name: 'dashboard-root',
    component: MicroAppHost,
    meta: { requiresAuth: true }
  },
  {
    path: '/dashboard/:path*',
    name: 'dashboard-mfe',
    component: MicroAppHost,
    meta: { requiresAuth: true }
  },
  {
    path: '/profile',
    name: 'profile-root',
    component: MicroAppHost,
    meta: { requiresAuth: true }
  },
  {
    path: '/profile/:path*',
    name: 'profile-mfe',
    component: MicroAppHost,
    meta: { requiresAuth: true }
  }
];