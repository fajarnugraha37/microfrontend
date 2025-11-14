import Home from '../views/Home.vue';
import Login from '../views/Login.vue';
import Users from '../views/Users.vue';
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
    component: Users
  },
  {
    path: '/dashboard',
    name: 'dashboard-root',
    component: MicroAppHost
  },
  {
    path: '/dashboard/:path*',
    name: 'dashboard-mfe',
    component: MicroAppHost
  },
  {
    path: '/profile',
    name: 'profile-root',
    component: MicroAppHost
  },
  {
    path: '/profile/:path*',
    name: 'profile-mfe',
    component: MicroAppHost
  }
];