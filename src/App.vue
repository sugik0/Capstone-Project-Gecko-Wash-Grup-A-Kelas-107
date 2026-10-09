<template>
  <div id="app">
    <AdminLayout v-if="isAdminRoute"><router-view /></AdminLayout>
    <router-view v-else />
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import AdminLayout from './components/AdminLayout.vue'

const route = useRoute()
const isAdminRoute = computed(() => ['/admin', '/kasir', '/laporan', '/pengaturan'].includes(route.path))
</script>

<style>
@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&display=swap');
:root { font-family: 'DM Sans', Inter, ui-sans-serif, system-ui, sans-serif; color: #171b26; background: #f6f7f9; font-synthesis: none; }
* { box-sizing: border-box; }
body { margin: 0; min-width: 320px; }
button, input, select { font: inherit; }
a { color: inherit; }
</style>
