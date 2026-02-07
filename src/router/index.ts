import { createRouter, createWebHistory } from 'vue-router'
import Dashboard from '@/views/Dashboard.vue'
import SelectDatabase from '@/views/SelectDatabase.vue'
import RaceResult from '@/views/RaceResult.vue'


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
    component: RaceResult,
    meta: {
      title: 'Data'
    }
  },
  {
    path: '/select-database',
    name: 'select-database',
    component: SelectDatabase,
    meta: {
      title: 'Select Database'
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
