import { defineStore } from 'pinia'
import { ref } from 'vue'
import { useStorage } from '@vueuse/core'

export const useSidebarStore = defineStore('sidebar', () => {
  const isSidebarOpen = ref(false)

  const selected = useStorage('selected', 'eCommerce')
  const page = useStorage('page', 'Dashboard')

  function toggleSidebar() {
    isSidebarOpen.value = !isSidebarOpen.value
  }

  function closeSidebar() {
    isSidebarOpen.value = false
  }

  return {
    isSidebarOpen,
    toggleSidebar,
    closeSidebar,
    selected,
    page
  }
})
