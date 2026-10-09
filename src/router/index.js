import { createRouter, createWebHistory } from 'vue-router'
import LandingView from '../views/LandingView.vue'
import KasirView from '../views/KasirView.vue'
import DisplayView from '../views/DisplayView.vue'
import SimulatorView from '../views/SimulatorView.vue'
import ReportView from '../views/ReportView.vue'
import SettingsView from '../views/SettingsView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: LandingView
    },
    {
      // /admin langsung diarahkan ke halaman kerja utama operator.
      path: '/admin',
      redirect: '/kasir'
    },
    {
      path: '/kasir',
      name: 'kasir',
      component: KasirView
    },
    {
      // Tetap tersedia untuk TV, tetapi tidak ditampilkan pada menu operator.
      path: '/display',
      name: 'display',
      component: DisplayView
    },
    {
      path: '/simulator',
      name: 'simulator',
      component: SimulatorView
    },
    {
      path: '/laporan',
      name: 'laporan',
      component: ReportView
    },
    {
      path: '/pengaturan',
      name: 'pengaturan',
      component: SettingsView
    }
  ]
})

export default router
