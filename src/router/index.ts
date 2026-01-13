import { createRouter, createWebHistory } from 'vue-router'
import TablesView from '@/views/TablesView.vue'
import Dashboard from '@/views/Dashboard.vue'

const routes = [
  {
    path: '/',
    name: 'dashboard',
    component: Dashboard,
    meta: {
      title: 'Dashboard'
    }
  },
  {
    path: '/data',
    name: 'data',
    component: TablesView,
    meta: {
      title: 'Data'
    }
  }
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
  scrollBehavior(to, from, savedPosition) {
    return savedPosition || { left: 0, top: 0 }
  }
})

router.beforeEach((to, from, next) => {
  document.title = `Registration - ${to.meta.title || ''}`
  next()
})

export default router
