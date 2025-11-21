import Home from '../views/Home.vue';
import Login from '../views/Login.vue';
import Users from '../views/Users.vue';
import ProductView from '../views/ProductView.vue';
import { qiankunApps } from '../use-qiankn';
import { mfApps } from '../use-mf'; 

/** @type {import('vue-router').RouteConfig[]} */
const routes = [
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
  ...qiankunApps.map(app => app.routes).flat(),
  ...mfApps.map(app => app.routes).flat(),
];

export {
  routes
}