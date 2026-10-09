<template>
  <div style="padding: 20px; max-width: 600px; margin: 0 auto; text-align: center;">
    <h2>🛠️ Simulator Sensor RFID</h2>
    <p style="color: #64748b; margin-bottom: 20px;">
      Status akan berubah warna secara otomatis sesuai pergerakan antrean.
    </p>

    <!-- Notifikasi Sukses / Error -->
    <div v-if="pesan" :style="{ background: pesanWarna, padding: '15px', color: 'white', borderRadius: '8px', marginBottom: '20px', fontWeight: 'bold' }">
      {{ pesan }}
    </div>

    <!-- Grid 10 Tombol Token Dinamis -->
    <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 15px;">
      <button 
        v-for="n in 10" 
        :key="n"
        @click="simulasiTap(String(n).padStart(2, '0'))"
        :style="{
          padding: '15px', 
          fontWeight: 'bold', 
          background: getTokenStatus(String(n).padStart(2, '0')).color, 
          color: 'white', 
          border: '2px solid #334155', 
          borderRadius: '8px', 
          cursor: 'pointer', 
          transition: '0.3s'
        }"
      >
        <div style="font-size: 1.2rem;">TOKEN #{{ String(n).padStart(2, '0') }}</div>
        <div style="font-size: 0.85rem; margin-top: 5px; opacity: 0.9;">
          {{ getTokenStatus(String(n).padStart(2, '0')).text }}
        </div>
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import api from '../services/api' // <-- Memanggil file API

const pesan = ref('')
const pesanWarna = ref('#0284c7')
const activeQueues = ref([])
let timer = null

const fetchQueues = async () => {
  try {
    const response = await api.getQueues()
    activeQueues.value = response.data
  } catch (error) {
    console.error('Gagal mengambil data:', error)
  }
}

const getTokenStatus = (noToken) => {
  const queue = activeQueues.value.find(item => item.token_number === noToken)
  if (queue) {
    if (queue.status === 'ANTRI') return { text: 'ANTRI ⚪', color: '#475569' }
    if (queue.status === 'PROSES CUCI') return { text: 'PROSES CUCI 🔵', color: '#0284c7' }
    if (queue.status === 'PENGERINGAN') return { text: 'PENGERINGAN 🟠', color: '#d97706' }
    if (queue.status === 'FINISH') return { text: 'FINISH 🟢', color: '#16a34a' }
  }
  return { text: 'KOSONG / BEBAS', color: '#1e293b' }
}

const simulasiTap = async (noToken) => {
  try {
    const response = await api.tapRfid(noToken)
    
    if (response.data.status === 'success') {
      pesanWarna.value = '#16a34a' 
      pesan.value = `✅ ${response.data.message}`
      fetchQueues() 
    } else {
      pesanWarna.value = '#dc2626'
      pesan.value = `❌ Ditolak: ${response.data.message}`
    }

    setTimeout(() => { pesan.value = '' }, 3000)
  } catch (error) {
    console.error('Gagal simulasi:', error)
    pesanWarna.value = '#dc2626'
    pesan.value = '❌ Terjadi kesalahan jaringan / server mati.'
  }
}

onMounted(() => {
  fetchQueues()
  timer = setInterval(fetchQueues, 2000)
})

onUnmounted(() => {
  clearInterval(timer)
})
</script>