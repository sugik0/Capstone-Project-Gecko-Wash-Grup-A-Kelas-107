<template>
  <section class="report-view">
    <div class="report-toolbar">
      <div class="toolbar-copy">
        <span class="eyebrow">Ringkasan transaksi</span>
        <h1>Laporan Harian</h1>
        <p>Pantau transaksi selesai dan pendapatan Gecko Wash berdasarkan tanggal.</p>
      </div>

      <div class="report-actions">
        <div class="date-filter">
          <label for="report-date">Tanggal laporan</label>
          <div class="date-control">
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <rect x="3" y="5" width="18" height="16" rx="2" />
              <path d="M16 3v4M8 3v4M3 10h18" />
            </svg>
            <input
              id="report-date"
              v-model="selectedDate"
              type="date"
              :max="today"
              @change="handleDateChange"
            >
          </div>
        </div>

        <button
          class="refresh-button"
          type="button"
          :disabled="refreshing"
          @click="manualRefresh"
        >
          <svg :class="{ spinning: refreshing }" viewBox="0 0 24 24" aria-hidden="true">
            <path d="M20 6v5h-5" />
            <path d="M4 18v-5h5" />
            <path d="M6.1 9a7 7 0 0 1 11.6-2.6L20 11" />
            <path d="M17.9 15a7 7 0 0 1-11.6 2.6L4 13" />
          </svg>
          {{ refreshing ? 'Memperbarui…' : 'Perbarui' }}
        </button>

        <small v-if="lastUpdatedLabel" class="last-updated">
          Terakhir diperbarui {{ lastUpdatedLabel }}
        </small>
      </div>
    </div>

    <div v-if="errorMessage" class="alert-error" role="alert">
      <div>
        <strong>Data laporan belum dapat dimuat.</strong>
        <span>{{ errorMessage }}</span>
      </div>
      <button type="button" @click="fetchReports">Coba lagi</button>
    </div>

    <div class="summary-grid" aria-label="Ringkasan laporan">
      <article class="summary-card revenue-card">
        <div class="summary-icon" aria-hidden="true">
          <svg viewBox="0 0 24 24">
            <path d="M4 7.5h16v11H4z" />
            <path d="M7 7.5V5h10v2.5M8 13h8" />
            <circle cx="12" cy="13" r="2.5" />
          </svg>
        </div>
        <div class="summary-copy">
          <span>Pendapatan</span>
          <strong>{{ loading ? 'Memuat…' : formatRupiah(summary.total_pendapatan) }}</strong>
          <small>{{ formatDateIndo(selectedDate) }}</small>
        </div>
      </article>

      <article class="summary-card units-card">
        <div class="summary-icon" aria-hidden="true">
          <svg viewBox="0 0 24 24">
            <circle cx="7" cy="17" r="3" />
            <circle cx="17" cy="17" r="3" />
            <path d="M7 17h4l2-6h4l2 3M10 8h4l2 3M12 11H7" />
          </svg>
        </div>
        <div class="summary-copy">
          <span>Motor Selesai</span>
          <strong>{{ loading ? '…' : totalMotorLabel }}</strong>
          <small>Transaksi selesai</small>
        </div>
      </article>
    </div>

    <section class="history-card" aria-labelledby="history-title">
      <div class="history-header">
        <div>
          <span class="eyebrow">Detail transaksi</span>
          <h2 id="history-title">Riwayat Transaksi</h2>
        </div>
        <div class="history-meta">
          <span>{{ formatDateIndo(selectedDate) }}</span>
          <strong>{{ history.length }} transaksi</strong>
        </div>
      </div>

      <div v-if="loading && history.length === 0" class="state-panel">
        <span class="spinner" aria-hidden="true"></span>
        <p>Mengambil data laporan…</p>
      </div>

      <div v-else-if="history.length === 0" class="state-panel empty-state">
        <div class="empty-icon" aria-hidden="true">
          <svg viewBox="0 0 24 24">
            <path d="M5 4h14v16H5z" />
            <path d="M8 8h8M8 12h8M8 16h5" />
          </svg>
        </div>
        <strong>Belum ada transaksi selesai</strong>
        <p>Tidak ada transaksi selesai pada tanggal yang dipilih.</p>
      </div>

      <template v-else>
        <div class="desktop-table-wrap">
          <table>
            <thead>
              <tr>
                <th>Waktu</th>
                <th>Nomor Polisi</th>
                <th>Jenis Motor</th>
                <th class="text-right">Nominal</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="item in history" :key="item.id">
                <td class="time-cell">{{ formatJam(item.created_at) }}</td>
                <td><strong class="plate-number">{{ item.plat_number }}</strong></td>
                <td>{{ item.motor_type }}</td>
                <td class="amount-cell text-right">{{ formatRupiah(item.price) }}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div class="mobile-history" aria-label="Daftar transaksi versi seluler">
          <article v-for="item in history" :key="`mobile-${item.id}`" class="transaction-card">
            <div class="transaction-top">
              <div>
                <span class="transaction-time">{{ formatJam(item.created_at) }}</span>
                <strong class="mobile-plate">{{ item.plat_number }}</strong>
              </div>
              <strong class="mobile-amount">{{ formatRupiah(item.price) }}</strong>
            </div>
            <div class="transaction-bottom">
              <span>Jenis motor</span>
              <strong>{{ item.motor_type }}</strong>
            </div>
          </article>
        </div>
      </template>
    </section>
  </section>
</template>

<script setup>
import { computed, onMounted, onUnmounted, ref } from 'vue'
import api from '../services/api'

const getLocalDateString = () => {
  const date = new Date()
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

const today = getLocalDateString()
const selectedDate = ref(today)
const summary = ref({ total_motor: 0, total_pendapatan: 0 })
const history = ref([])
const loading = ref(false)
const refreshing = ref(false)
const errorMessage = ref('')
const lastUpdatedAt = ref(null)
let lastFetchTimestamp = 0

const totalMotorLabel = computed(() => `${Number(summary.value.total_motor || 0)} Unit`)
const lastUpdatedLabel = computed(() => {
  if (!lastUpdatedAt.value) return ''

  return lastUpdatedAt.value.toLocaleTimeString('id-ID', {
    hour: '2-digit',
    minute: '2-digit'
  })
})

const formatRupiah = (value) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(Number(value || 0))
}

const formatJam = (dateValue) => {
  if (!dateValue) return '-'

  const parsed = new Date(dateValue)
  if (Number.isNaN(parsed.getTime())) return '-'

  return parsed.toLocaleTimeString('id-ID', {
    hour: '2-digit',
    minute: '2-digit'
  })
}

const formatDateIndo = (dateString) => {
  if (!dateString) return '-'

  const [year, month, day] = dateString.split('-').map(Number)
  const parsed = new Date(year, month - 1, day)

  return parsed.toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  })
}

const fetchReports = async ({ silent = false } = {}) => {
  if (silent) {
    refreshing.value = true
  } else {
    loading.value = true
  }

  errorMessage.value = ''
  const requestedDate = selectedDate.value

  try {
    const response = await api.getReports(requestedDate)

    // Abaikan respons lama jika pengguna sudah berpindah tanggal.
    if (requestedDate !== selectedDate.value) return

    summary.value = response.data?.summary || { total_motor: 0, total_pendapatan: 0 }
    history.value = Array.isArray(response.data?.history) ? response.data.history : []
    lastUpdatedAt.value = new Date()
    lastFetchTimestamp = Date.now()
  } catch (error) {
    console.error('Gagal mengambil laporan:', error)
    errorMessage.value = 'Periksa koneksi ke server lalu coba kembali.'
  } finally {
    loading.value = false
    refreshing.value = false
  }
}

const handleDateChange = () => {
  lastUpdatedAt.value = null
  fetchReports()
}

const manualRefresh = () => {
  fetchReports({ silent: history.value.length > 0 })
}

const refreshWhenReturning = () => {
  // Laporan lama tidak berubah, jadi auto-refresh hanya untuk laporan hari ini.
  // Jika operator kembali ke halaman/tab setelah >60 detik, data diperbarui
  // secara senyap tanpa membuat seluruh tampilan berkedip.
  const staleFor = Date.now() - lastFetchTimestamp
  if (document.visibilityState === 'visible' && selectedDate.value === today && staleFor > 60000) {
    fetchReports({ silent: true })
  }
}

onMounted(() => {
  fetchReports()
  document.addEventListener('visibilitychange', refreshWhenReturning)
  window.addEventListener('focus', refreshWhenReturning)
})

onUnmounted(() => {
  document.removeEventListener('visibilitychange', refreshWhenReturning)
  window.removeEventListener('focus', refreshWhenReturning)
})
</script>

<style scoped>
.report-view {
  width: 100%;
  max-width: 1180px;
  margin: 0 auto;
}

.report-toolbar {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 24px;
  margin-bottom: 18px;
}

.toolbar-copy {
  min-width: 0;
}

.eyebrow {
  display: block;
  margin-bottom: 5px;
  color: #2864d7;
  font-size: 12px;
  font-weight: 800;
  letter-spacing: .08em;
  text-transform: uppercase;
}

.toolbar-copy h1,
.history-header h2 {
  margin: 0;
  color: #171b26;
  letter-spacing: -.03em;
}

.toolbar-copy h1 {
  font-size: clamp(25px, 3vw, 34px);
}

.toolbar-copy p {
  max-width: 620px;
  margin: 7px 0 0;
  color: #727b89;
  font-size: 14px;
  line-height: 1.55;
}

.report-actions {
  flex: 0 0 auto;
  display: grid;
  grid-template-columns: 230px auto;
  align-items: end;
  gap: 8px;
}

.date-filter {
  min-width: 0;
}

.refresh-button {
  height: 46px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 7px;
  padding: 0 14px;
  border: 1px solid #dfe3e9;
  border-radius: 14px;
  color: #3d4654;
  background: #fff;
  font: inherit;
  font-size: 13px;
  font-weight: 750;
  cursor: pointer;
  transition: border-color .18s ease, background .18s ease, color .18s ease;
}

.refresh-button:hover:not(:disabled) {
  color: #2864d7;
  background: #f7faff;
  border-color: #b8cdf4;
}

.refresh-button:disabled {
  cursor: wait;
  opacity: .7;
}

.refresh-button svg {
  width: 17px;
  height: 17px;
  fill: none;
  stroke: currentColor;
  stroke-width: 1.8;
  stroke-linecap: round;
  stroke-linejoin: round;
}

.refresh-button svg.spinning {
  animation: spin .75s linear infinite;
}

.last-updated {
  grid-column: 1 / -1;
  justify-self: end;
  margin-top: -2px;
  color: #969da8;
  font-size: 10px;
}

.date-filter label {
  display: block;
  margin-bottom: 7px;
  color: #596170;
  font-size: 12px;
  font-weight: 700;
}

.date-control {
  position: relative;
  display: flex;
  align-items: center;
  height: 46px;
  background: #fff;
  border: 1px solid #dfe3e9;
  border-radius: 14px;
  transition: border-color .18s ease, box-shadow .18s ease;
}

.date-control:focus-within {
  border-color: #8fb4f7;
  box-shadow: 0 0 0 3px rgba(40, 100, 215, .09);
}

.date-control svg {
  position: absolute;
  left: 13px;
  width: 19px;
  height: 19px;
  color: #667085;
  fill: none;
  stroke: currentColor;
  stroke-width: 1.8;
  stroke-linecap: round;
  stroke-linejoin: round;
  pointer-events: none;
}

.date-control input {
  width: 100%;
  height: 100%;
  padding: 0 12px 0 41px;
  border: 0;
  outline: 0;
  color: #252a35;
  background: transparent;
  font: inherit;
  font-size: 14px;
  font-weight: 650;
  cursor: pointer;
}

.alert-error {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 16px;
  padding: 13px 15px;
  color: #9f2d2d;
  background: #fff4f4;
  border: 1px solid #f3cccc;
  border-radius: 14px;
}

.alert-error div {
  display: grid;
  gap: 2px;
}

.alert-error strong {
  font-size: 13px;
}

.alert-error span {
  color: #ad5757;
  font-size: 12px;
}

.alert-error button {
  flex: 0 0 auto;
  padding: 8px 11px;
  border: 0;
  border-radius: 10px;
  color: #fff;
  background: #b83c3c;
  font-weight: 750;
  cursor: pointer;
}

.summary-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px;
  margin-bottom: 18px;
}

.summary-card {
  min-width: 0;
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 20px;
  background: #fff;
  border: 1px solid #e1e4e9;
  border-radius: 20px;
}

.summary-icon {
  flex: 0 0 auto;
  display: grid;
  place-items: center;
  width: 52px;
  height: 52px;
  border-radius: 16px;
}

.summary-icon svg {
  width: 26px;
  height: 26px;
  fill: none;
  stroke: currentColor;
  stroke-width: 1.8;
  stroke-linecap: round;
  stroke-linejoin: round;
}

.revenue-card .summary-icon {
  color: #16824f;
  background: #eaf8f1;
}

.units-card .summary-icon {
  color: #2864d7;
  background: #edf4ff;
}

.summary-copy {
  min-width: 0;
  display: grid;
}

.summary-copy span {
  color: #6e7684;
  font-size: 13px;
  font-weight: 700;
}

.summary-copy strong {
  margin-top: 4px;
  overflow: hidden;
  color: #171b26;
  font-size: clamp(23px, 3vw, 32px);
  font-weight: 820;
  letter-spacing: -.035em;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.summary-copy small {
  margin-top: 4px;
  color: #959ba5;
  font-size: 11px;
}

.history-card {
  overflow: hidden;
  background: #fff;
  border: 1px solid #e1e4e9;
  border-radius: 20px;
}

.history-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 19px 20px 16px;
  border-bottom: 1px solid #edf0f3;
}

.history-header h2 {
  font-size: 20px;
}

.history-meta {
  flex: 0 0 auto;
  display: grid;
  justify-items: end;
  gap: 2px;
  color: #8a919d;
  font-size: 11px;
}

.history-meta strong {
  color: #555e6c;
  font-size: 12px;
}

.desktop-table-wrap {
  overflow-x: auto;
}

table {
  width: 100%;
  min-width: 680px;
  border-collapse: collapse;
}

th {
  padding: 12px 20px;
  color: #737b89;
  background: #f8f9fb;
  border-bottom: 1px solid #edf0f3;
  font-size: 11px;
  font-weight: 800;
  letter-spacing: .045em;
  text-align: left;
  text-transform: uppercase;
}

td {
  height: 64px;
  padding: 12px 20px;
  color: #48505d;
  border-bottom: 1px solid #f0f2f5;
  font-size: 14px;
}

tbody tr:last-child td {
  border-bottom: 0;
}

tbody tr:hover {
  background: #fbfcfd;
}

.text-right {
  text-align: right;
}

.time-cell {
  color: #7e8794;
  font-variant-numeric: tabular-nums;
}

.plate-number {
  color: #222733;
  font-size: 15px;
  letter-spacing: .025em;
}

.amount-cell {
  color: #16824f;
  font-weight: 800;
  white-space: nowrap;
}

.mobile-history {
  display: none;
}

.state-panel {
  min-height: 250px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  gap: 10px;
  padding: 32px;
  color: #8b93a0;
  text-align: center;
}

.state-panel p {
  margin: 0;
  font-size: 13px;
}

.empty-state strong {
  color: #555e6c;
  font-size: 15px;
}

.empty-icon {
  display: grid;
  place-items: center;
  width: 48px;
  height: 48px;
  margin-bottom: 2px;
  color: #8a94a3;
  background: #f4f6f8;
  border-radius: 15px;
}

.empty-icon svg {
  width: 24px;
  height: 24px;
  fill: none;
  stroke: currentColor;
  stroke-width: 1.8;
  stroke-linecap: round;
  stroke-linejoin: round;
}

.spinner {
  width: 25px;
  height: 25px;
  border: 3px solid #e1e7f0;
  border-top-color: #2864d7;
  border-radius: 50%;
  animation: spin .75s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

@media (max-width: 760px) {
  .report-toolbar {
    align-items: stretch;
    flex-direction: column;
    gap: 14px;
    margin-bottom: 14px;
  }

  .toolbar-copy h1 {
    font-size: 24px;
  }

  .toolbar-copy p {
    margin-top: 5px;
    font-size: 12px;
  }

  .report-actions {
    width: 100%;
    grid-template-columns: minmax(0, 1fr) auto;
  }

  .date-filter {
    width: 100%;
  }

  .date-control {
    height: 43px;
    border-radius: 12px;
  }

  .refresh-button {
    height: 43px;
    border-radius: 12px;
  }

  .summary-grid {
    gap: 9px;
    margin-bottom: 12px;
  }

  .summary-card {
    gap: 10px;
    padding: 14px;
    border-radius: 16px;
  }

  .summary-icon {
    width: 41px;
    height: 41px;
    border-radius: 12px;
  }

  .summary-icon svg {
    width: 21px;
    height: 21px;
  }

  .summary-copy span {
    font-size: 11px;
  }

  .summary-copy strong {
    font-size: 20px;
  }

  .summary-copy small {
    font-size: 10px;
  }

  .history-card {
    border-radius: 16px;
  }

  .history-header {
    align-items: flex-start;
    padding: 15px;
  }

  .history-header h2 {
    font-size: 17px;
  }

  .history-meta {
    max-width: 120px;
    text-align: right;
  }

  .desktop-table-wrap {
    display: none;
  }

  .mobile-history {
    display: grid;
    gap: 8px;
    padding: 10px;
    background: #f8f9fb;
  }

  .transaction-card {
    padding: 13px;
    background: #fff;
    border: 1px solid #e4e7ec;
    border-radius: 14px;
  }

  .transaction-top {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 12px;
  }

  .transaction-top > div {
    min-width: 0;
    display: grid;
    gap: 3px;
  }

  .transaction-time {
    color: #8a919d;
    font-size: 10px;
    font-weight: 650;
  }

  .mobile-plate {
    overflow: hidden;
    color: #202632;
    font-size: 16px;
    letter-spacing: .02em;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .mobile-amount {
    flex: 0 0 auto;
    color: #16824f;
    font-size: 14px;
    white-space: nowrap;
  }

  .transaction-bottom {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    margin-top: 11px;
    padding-top: 10px;
    border-top: 1px solid #eef0f3;
  }

  .transaction-bottom span {
    color: #8b93a0;
    font-size: 10px;
  }

  .transaction-bottom strong {
    overflow: hidden;
    color: #56606e;
    font-size: 11px;
    text-align: right;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .state-panel {
    min-height: 210px;
    padding: 24px 14px;
  }
}

@media (max-width: 480px) {
  .eyebrow {
    font-size: 10px;
  }

  .toolbar-copy h1 {
    font-size: 21px;
  }

  .summary-grid {
    grid-template-columns: 1fr;
  }

  .summary-card {
    min-height: 78px;
  }

  .summary-copy strong {
    font-size: 21px;
  }

  .history-header {
    gap: 10px;
  }

  .history-meta span {
    display: none;
  }

  .report-actions {
    grid-template-columns: 1fr;
  }

  .refresh-button {
    width: 100%;
  }

  .last-updated {
    justify-self: start;
  }

  .alert-error {
    align-items: stretch;
    flex-direction: column;
  }

  .alert-error button {
    width: 100%;
  }
}

@media (max-width: 360px) {
  .toolbar-copy p {
    display: none;
  }

  .mobile-history {
    padding: 7px;
  }

  .transaction-card {
    padding: 11px;
  }

  .mobile-plate {
    font-size: 15px;
  }

  .mobile-amount {
    font-size: 13px;
  }
}
</style>
