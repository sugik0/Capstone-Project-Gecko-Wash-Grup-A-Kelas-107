<template>
  <div class="admin-shell">
    <aside class="sidebar" aria-label="Navigasi operator">
      <RouterLink
        class="brand-mark"
        to="/kasir"
        aria-label="Gecko Wash - Kasir"
        title="Kasir"
      >
        G
      </RouterLink>

      <nav aria-label="Menu operator">
        <RouterLink
          v-for="item in items"
          :key="item.to"
          :to="item.to"
          class="nav-link"
          :class="{ active: route.path === item.to }"
          :aria-label="item.label"
          :title="item.label"
        >
          <svg v-if="item.icon === 'cashier'" viewBox="0 0 24 24" aria-hidden="true">
            <rect x="5" y="4" width="15" height="16" rx="2" />
            <circle cx="12.5" cy="10" r="2.2" />
            <path d="M8.5 17c.6-2 2-3 4-3s3.4 1 4 3M3 7v14h13" />
          </svg>

          <svg v-else-if="item.icon === 'report'" viewBox="0 0 24 24" aria-hidden="true">
            <path d="M4 19V14M11 19V8M18 19V4M4 14l7-6 7-4" />
            <circle cx="4" cy="14" r="1.7" />
            <circle cx="11" cy="8" r="1.7" />
            <circle cx="18" cy="4" r="1.7" />
          </svg>

          <svg v-else viewBox="0 0 24 24" aria-hidden="true">
            <path d="m10 2-.6 2.1a8 8 0 0 0-1.8 1L5.5 4.4 3.4 8l1.7 1.5a8 8 0 0 0 0 2.1l-1.7 1.5 2.1 3.6 2.1-.7a8 8 0 0 0 1.8 1L10 19h4l.6-2.1a8 8 0 0 0 1.8-1l2.1.7 2.1-3.6-1.7-1.5a8 8 0 0 0 0-2.1L20.6 8l-2.1-3.6-2.1.7a8 8 0 0 0-1.8-1L14 2z" />
            <circle cx="12" cy="10.5" r="2.5" />
          </svg>
        </RouterLink>
      </nav>
    </aside>

    <main class="admin-main">
      <header class="admin-header">
        <div class="brand-copy">
          <RouterLink to="/kasir" class="wordmark">GECKO WASH TOUCHLESS</RouterLink>
          <p>Cuci Motor Cepat, Bersih, dan Tanpa Goresan!</p>
        </div>
        <div class="page-label">{{ pageTitle }}</div>
      </header>

      <slot />
    </main>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute, RouterLink } from 'vue-router'

const route = useRoute()

const items = [
  { to: '/kasir', label: 'Kasir', icon: 'cashier' },
  { to: '/laporan', label: 'Laporan', icon: 'report' },
  { to: '/pengaturan', label: 'Pengaturan', icon: 'settings' }
]

const pageTitle = computed(() => ({
  '/kasir': 'Kasir / Operator',
  '/laporan': 'Laporan',
  '/pengaturan': 'Pengaturan'
}[route.path] || 'Kasir / Operator'))
</script>

<style scoped>
.admin-shell {
  min-height: 100vh;
  background: #f7f8fa;
}

.sidebar {
  position: fixed;
  inset: 0 auto 0 0;
  width: 82px;
  z-index: 20;
  display: flex;
  align-items: center;
  flex-direction: column;
  gap: 18px;
  padding: 14px 9px;
  background: #fff;
  border-right: 1px solid #e3e6eb;
  box-shadow: 5px 0 18px rgba(24, 33, 52, 0.035);
}

.brand-mark {
  flex: 0 0 auto;
  display: grid;
  place-items: center;
  width: 44px;
  height: 44px;
  color: #fff;
  text-decoration: none;
  background: #141a28;
  border-radius: 14px;
  font-size: 21px;
  font-weight: 800;
  line-height: 1;
}

nav {
  width: 100%;
  display: grid;
  gap: 9px;
}

.nav-link {
  width: 100%;
  height: 48px;
  border: 1px solid transparent;
  border-radius: 14px;
  display: grid;
  place-items: center;
  color: #7b8290;
  background: transparent;
  transition: background .18s ease, color .18s ease, border-color .18s ease, transform .18s ease;
}

.nav-link:hover {
  color: #2864d7;
  background: #f5f8fd;
}

.nav-link:active {
  transform: scale(.96);
}

.nav-link svg {
  width: 23px;
  height: 23px;
  stroke: currentColor;
  fill: none;
  stroke-width: 2.15;
  stroke-linecap: round;
  stroke-linejoin: round;
}

.nav-link.active {
  color: #2864d7;
  background: #edf4ff;
  border-color: #dce9ff;
}

.admin-main {
  margin-left: 82px;
  padding: 30px 32px 48px;
}

.admin-header {
  min-height: 72px;
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 20px;
  margin-bottom: 20px;
}

.wordmark {
  color: #171b26;
  text-decoration: none;
  font-size: 25px;
  font-weight: 800;
  letter-spacing: -.55px;
}

.admin-header p {
  margin: 3px 0 0;
  color: #737b89;
  font-size: 15px;
}

.page-label {
  flex: 0 0 auto;
  padding: 10px 16px;
  color: #252a35;
  background: #fff;
  border: 1px solid #e1e4e9;
  border-radius: 14px;
  font-size: 18px;
  font-weight: 750;
  white-space: nowrap;
}

@media (max-width: 760px) {
  .sidebar {
    width: 58px;
    gap: 13px;
    padding: 9px 6px;
  }

  .brand-mark {
    width: 38px;
    height: 38px;
    border-radius: 12px;
    font-size: 18px;
  }

  nav {
    gap: 7px;
  }

  .nav-link {
    height: 42px;
    border-radius: 12px;
  }

  .nav-link svg {
    width: 21px;
    height: 21px;
  }

  .admin-main {
    margin-left: 58px;
    padding: 14px 10px 30px;
  }

  .admin-header {
    min-height: 0;
    align-items: center;
    gap: 8px;
    margin-bottom: 14px;
  }

  .wordmark {
    font-size: 17px;
    letter-spacing: -.3px;
  }

  .admin-header p {
    display: none;
  }

  .page-label {
    padding: 7px 10px;
    border-radius: 11px;
    font-size: 12px;
  }
}

@media (max-width: 390px) {
  .sidebar {
    width: 54px;
    padding-inline: 5px;
  }

  .brand-mark {
    width: 36px;
    height: 36px;
  }

  .nav-link {
    height: 40px;
  }

  .admin-main {
    margin-left: 54px;
    padding-inline: 8px;
  }

  .wordmark {
    font-size: 15px;
  }

  .page-label {
    max-width: 108px;
    overflow: hidden;
    text-overflow: ellipsis;
  }
}
</style>
