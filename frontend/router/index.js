import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '../stores/auth'


const routes = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('../views/Login.vue'),
    meta: { requiresAuth: false }
  },
  // {
  //   path: '/register',
  //   name: 'Register',
  //   component: () => import('../views/Register.vue'),
  //   meta: { requiresAuth: false }
  // },
  {
    path: '/',
    name: 'Dashboard',
    component: () => import('../views/Dashboard.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/users',
    name: 'Users',
    component: () => import('../views/Users.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/accounts',
    name: 'Accounts',
    component: () => import('../views/Accounts.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/profile',
    name: 'Profile',
    component: () => import('../views/Profile.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/api-services',
    name: 'ApiServices',
    component: () => import('../views/ApiServices.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/api-services/:accountId?',
    name: 'ApiServicesWithAccount',
    component: () => import('../views/ApiServices.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/user-management/:accountId',
    name: 'UserManagement',
    component: () => import('../components/UserManagment/UserList.vue'),
    meta: { requiresAuth: true },
    props: true
  },
  {
    path: '/security-settings/:accountId',
    name: 'SecuritySettings',
    component: () => import('../views/SecuritySettings.vue'),
    meta: { requiresAuth: true }
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

// Навигационный guard
router.beforeEach(async (to, from, next) => {
  const authStore = useAuthStore()
  
  // Проверяем токен при первом переходе
  if (authStore.token && !authStore.user) {
    const isValid = await authStore.verifyToken()
    if (!isValid) {
      next('/login')
      return
    }
  }

  const isAuthenticated = !!authStore.user

  if (to.meta.requiresAuth && !isAuthenticated) {
    next('/login')
  } else if ((to.path === '/login' || to.path === '/register') && isAuthenticated) {
    next('/')
  } else {
    next()
  }
})

export default router