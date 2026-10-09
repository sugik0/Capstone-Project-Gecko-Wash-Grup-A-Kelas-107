<template>
  <section class="kasir-view">
    <!-- Ringkasan operasional -->
    <div class="summary-grid" aria-label="Ringkasan antrean">
      <article class="summary-card">
        <div class="summary-icon summary-icon-blue">
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M4 7h16M4 12h16M4 17h10" />
          </svg>
        </div>
        <div>
          <span>Antrean Aktif</span>
          <strong>{{ activeQueues.length }}</strong>
        </div>
      </article>

      <article class="summary-card">
        <div class="summary-icon summary-icon-amber">
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <circle cx="12" cy="12" r="8" />
            <path d="M12 8v5l3 2" />
          </svg>
        </div>
        <div>
          <span>Menunggu</span>
          <strong>{{ queueSummary.antri }}</strong>
        </div>
      </article>

      <article class="summary-card">
        <div class="summary-icon summary-icon-cyan">
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M6 17h12M8 17l1-7h6l1 7M9 10V7h6v3" />
            <path d="M4 20h16" />
          </svg>
        </div>
        <div>
          <span>Sedang Diproses</span>
          <strong>{{ queueSummary.proses }}</strong>
        </div>
      </article>

      <article class="summary-card">
        <div class="summary-icon summary-icon-green">
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="m6 12 4 4 8-9" />
          </svg>
        </div>
        <div>
          <span>Siap Diselesaikan</span>
          <strong>{{ queueSummary.finish }}</strong>
        </div>
      </article>

      <article class="summary-card">
        <div class="summary-icon summary-icon-violet">
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <rect x="5" y="5" width="14" height="14" rx="2" />
            <path d="M9 9h6v6H9z" />
          </svg>
        </div>
        <div>
          <span>Kartu Tersedia</span>
          <strong>{{ availableTokenCount }}</strong>
        </div>
      </article>
    </div>

    <div class="workspace-grid">
      <!-- Form pendaftaran kendaraan -->
      <article class="panel registration-panel">
        <div class="panel-heading">
          <div>
            <span class="eyebrow">PENDAFTARAN</span>
            <h2>Antrean Baru</h2>
            <p>Daftarkan kendaraan dan pilih kartu RFID reusable yang tersedia.</p>
          </div>
          <span class="live-pill">
            <span class="live-dot"></span>
            Operator
          </span>
        </div>

        <form class="registration-form" @submit.prevent="submitCheckin">
          <div class="field-group">
            <label for="plat-number">Nomor Polisi</label>
            <div class="input-shell plate-shell">
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M4 7h16v10H4zM7 10h10M7 14h6" />
              </svg>
              <input
                id="plat-number"
                v-model="form.plat_number"
                type="text"
                autocomplete="off"
                placeholder="Contoh: DK 1234 AB"
                maxlength="20"
                @input="normalizePlateInput"
              />
            </div>
            <small>Gunakan nomor polisi yang terpasang pada kendaraan.</small>
          </div>

          <div class="field-group">
            <label for="motor-type">Jenis Motor & Tarif</label>
            <div class="select-shell">
              <select id="motor-type" v-model="form.motor_type" :disabled="settingsLoading">
                <option value="" disabled>
                  {{ settingsLoading ? 'Memuat jenis motor...' : 'Pilih jenis motor' }}
                </option>
                <option v-for="tipe in motorTypes" :key="tipe.id" :value="tipe.name">
                  {{ tipe.name }} — {{ formatCurrency(tipe.price) }}
                </option>
              </select>
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m8 10 4 4 4-4" /></svg>
            </div>
            <div v-if="selectedMotor" class="price-preview">
              <span>Tarif layanan</span>
              <strong>{{ formatCurrency(selectedMotor.price) }}</strong>
            </div>
          </div>

          <div class="field-group token-field">
            <div class="field-title-row">
              <div>
                <label>Pilih Kartu RFID Reusable</label>
                <small>{{ availableTokenCount }} kartu siap digunakan</small>
              </div>
              <button
                v-if="form.token_number"
                type="button"
                class="text-button"
                @click="form.token_number = ''"
              >
                Hapus pilihan
              </button>
            </div>

            <div v-if="settingsLoading" class="token-skeleton-grid" aria-label="Memuat kartu RFID">
              <span v-for="n in 10" :key="n" class="token-skeleton"></span>
            </div>

            <div v-else class="token-grid">
              <button
                v-for="rfid in rfidTokens"
                :key="rfid.token_number"
                type="button"
                class="token-button"
                :class="{
                  selected: form.token_number === rfid.token_number,
                  unavailable: !isTokenAvailable(rfid)
                }"
                :disabled="!isTokenAvailable(rfid)"
                :aria-pressed="form.token_number === rfid.token_number"
                @click="selectToken(rfid.token_number)"
              >
                <span class="token-number">{{ rfid.token_number }}</span>
                <span class="token-state">
                  {{ tokenStateLabel(rfid) }}
                </span>
              </button>
            </div>
          </div>

          <div class="registration-summary" :class="{ ready: formReady }">
            <div>
              <span>Kendaraan</span>
              <strong>{{ form.plat_number || 'Belum diisi' }}</strong>
            </div>
            <div>
              <span>Kartu</span>
              <strong>{{ form.token_number ? `#${form.token_number}` : 'Belum dipilih' }}</strong>
            </div>
            <div>
              <span>Total</span>
              <strong>{{ selectedMotor ? formatCurrency(selectedMotor.price) : '—' }}</strong>
            </div>
          </div>

          <button class="primary-button" type="submit" :disabled="submitting || !formReady">
            <svg v-if="!submitting" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M12 5v14M5 12h14" />
            </svg>
            <span v-else class="spinner" aria-hidden="true"></span>
            {{ submitting ? 'Mendaftarkan...' : 'Tambahkan ke Antrean' }}
          </button>
        </form>
      </article>

      <!-- Daftar antrean aktif -->
      <article class="panel queue-panel">
        <div class="queue-heading">
          <div>
            <span class="eyebrow">OPERASIONAL HARI INI</span>
            <h2>Antrean Aktif</h2>
            <p>Status kendaraan diperbarui otomatis setiap ±2 detik.</p>
          </div>

          <button class="refresh-button" type="button" :disabled="refreshing" @click="manualRefresh">
            <svg :class="{ spinning: refreshing }" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M20 11a8 8 0 1 0-2.3 5.7M20 5v6h-6" />
            </svg>
            <span>{{ refreshing ? 'Memuat' : 'Refresh' }}</span>
          </button>
        </div>

        <div class="queue-tools">
          <div class="search-shell">
            <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="7" /><path d="m20 20-4-4" /></svg>
            <input v-model="searchQuery" type="search" placeholder="Cari nomor polisi atau kartu..." />
          </div>

          <div class="status-filter" role="group" aria-label="Filter status">
            <button
              v-for="filter in statusFilters"
              :key="filter.value"
              type="button"
              :class="{ active: selectedStatus === filter.value }"
              @click="selectedStatus = filter.value"
            >
              {{ filter.label }}
            </button>
          </div>
        </div>

        <div v-if="loadingQueues" class="queue-loading">
          <span class="spinner spinner-dark"></span>
          <p>Memuat antrean aktif...</p>
        </div>

        <div v-else-if="filteredQueues.length" class="queue-list">
          <article v-for="item in filteredQueues" :key="item.id" class="queue-item">
            <div class="queue-main">
              <div class="token-badge">
                <small>KARTU</small>
                <strong>{{ item.token_number }}</strong>
              </div>

              <div class="vehicle-info">
                <div class="vehicle-topline">
                  <h3>{{ item.plat_number }}</h3>
                  <span class="status-badge" :class="statusClass(item.status)">
                    <span class="status-dot"></span>
                    {{ statusLabel(item.status) }}
                  </span>
                </div>

                <div class="vehicle-meta">
                  <span>
                    <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 15h14l-2-5H7zM7 15v3M17 15v3M9 10V7h6v3" /></svg>
                    {{ item.motor_type }}
                  </span>
                  <span>
                    <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="8" /><path d="M12 8v4l3 2" /></svg>
                    {{ formatQueueTime(item.created_at) }}
                  </span>
                  <span>
                    <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 5h12v14H6zM9 9h6M9 13h6" /></svg>
                    {{ formatCurrency(item.price) }}
                  </span>
                </div>

                <div class="progress-track" :aria-label="`Status ${statusLabel(item.status)}`">
                  <div
                    v-for="(step, index) in serviceSteps"
                    :key="step.value"
                    class="progress-step"
                    :class="{
                      done: statusIndex(item.status) > index,
                      current: statusIndex(item.status) === index
                    }"
                  >
                    <span class="progress-node"></span>
                    <span class="progress-label">{{ step.short }}</span>
                  </div>
                </div>
              </div>
            </div>

            <div class="queue-actions">
              <button class="action-button edit" type="button" :disabled="actionLoadingId === item.id" @click="openEditModal(item)">
                <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m4 20 4-.8L18.5 8.7a2 2 0 0 0-2.8-2.8L5.2 16.4zM14.5 7l2.8 2.8" /></svg>
                Edit Plat
              </button>

              <button
                v-if="item.status === 'ANTRI'"
                class="action-button danger"
                type="button"
                :disabled="actionLoadingId === item.id"
                @click="openCancelModal(item)"
              >
                <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18" /></svg>
                Batalkan
              </button>

              <button
                v-if="item.status === 'FINISH'"
                class="action-button complete"
                type="button"
                :disabled="actionLoadingId === item.id"
                @click="openCompleteModal(item)"
              >
                <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m6 12 4 4 8-9" /></svg>
                Selesaikan Transaksi
              </button>
            </div>
          </article>
        </div>

        <div v-else class="empty-state">
          <div class="empty-icon">
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h16M4 12h12M4 17h8" /></svg>
          </div>
          <h3>{{ activeQueues.length ? 'Antrean tidak ditemukan' : 'Belum ada antrean aktif' }}</h3>
          <p>
            {{ activeQueues.length
              ? 'Coba ubah kata pencarian atau filter status.'
              : 'Kendaraan yang didaftarkan akan muncul di bagian ini.' }}
          </p>
        </div>
      </article>
    </div>

    <!-- Toast -->
    <Transition name="toast">
      <div v-if="toast.show" class="toast" :class="`toast-${toast.type}`" role="status">
        <div class="toast-icon">
          <svg v-if="toast.type === 'success'" viewBox="0 0 24 24" aria-hidden="true"><path d="m6 12 4 4 8-9" /></svg>
          <svg v-else viewBox="0 0 24 24" aria-hidden="true"><path d="M12 8v5M12 17h.01M4.9 19h14.2L12 5z" /></svg>
        </div>
        <div>
          <strong>{{ toast.type === 'success' ? 'Berhasil' : 'Perhatian' }}</strong>
          <p>{{ toast.message }}</p>
        </div>
        <button type="button" aria-label="Tutup notifikasi" @click="toast.show = false">×</button>
      </div>
    </Transition>

    <!-- Modal edit plat -->
    <Teleport to="body">
      <div v-if="editModal.open" class="modal-backdrop" @click.self="closeEditModal">
        <div class="modal-card" role="dialog" aria-modal="true" aria-labelledby="edit-title">
          <div class="modal-icon modal-icon-amber">
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m4 20 4-.8L18.5 8.7a2 2 0 0 0-2.8-2.8L5.2 16.4zM14.5 7l2.8 2.8" /></svg>
          </div>
          <h3 id="edit-title">Edit Nomor Polisi</h3>
          <p>Perbarui nomor polisi untuk kartu <strong>#{{ editModal.item?.token_number }}</strong>.</p>
          <label for="edit-plate">Nomor polisi</label>
          <input id="edit-plate" v-model="editModal.plat" type="text" maxlength="20" @input="normalizeEditPlate" @keyup.enter="saveEditPlat" />
          <div class="modal-actions">
            <button type="button" class="modal-secondary" @click="closeEditModal">Batal</button>
            <button type="button" class="modal-primary" :disabled="actionLoadingId === editModal.item?.id" @click="saveEditPlat">Simpan Perubahan</button>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- Modal pembatalan -->
    <Teleport to="body">
      <div v-if="cancelModal.open" class="modal-backdrop" @click.self="closeCancelModal">
        <div class="modal-card" role="dialog" aria-modal="true" aria-labelledby="cancel-title">
          <div class="modal-icon modal-icon-red">
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18" /></svg>
          </div>
          <h3 id="cancel-title">Batalkan Antrean?</h3>
          <p>
            Kendaraan <strong>{{ cancelModal.item?.plat_number }}</strong> dengan kartu
            <strong>#{{ cancelModal.item?.token_number }}</strong> akan dikeluarkan dari antrean aktif.
          </p>
          <div class="modal-actions">
            <button type="button" class="modal-secondary" @click="closeCancelModal">Kembali</button>
            <button type="button" class="modal-danger" :disabled="actionLoadingId === cancelModal.item?.id" @click="confirmCancel">Ya, Batalkan</button>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- Modal penyelesaian transaksi -->
    <Teleport to="body">
      <div v-if="completeModal.open" class="modal-backdrop" @click.self="closeCompleteModal">
        <div class="modal-card complete-modal" role="dialog" aria-modal="true" aria-labelledby="complete-title">
          <div class="modal-icon modal-icon-green">
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m6 12 4 4 8-9" /></svg>
          </div>
          <h3 id="complete-title">Selesaikan Transaksi</h3>
          <p>Pastikan kendaraan telah selesai dikerjakan sebelum transaksi ditutup.</p>

          <div class="transaction-preview">
            <div><span>Kartu</span><strong>#{{ completeModal.item?.token_number }}</strong></div>
            <div><span>Nomor Polisi</span><strong>{{ completeModal.item?.plat_number }}</strong></div>
            <div><span>Jenis Motor</span><strong>{{ completeModal.item?.motor_type }}</strong></div>
            <div class="transaction-total"><span>Total</span><strong>{{ formatCurrency(completeModal.item?.price) }}</strong></div>
          </div>

          <div class="modal-note">Setelah diselesaikan, sistem akan menampilkan simulasi struk melalui alert.</div>
          <div class="modal-actions">
            <button type="button" class="modal-secondary" @click="closeCompleteModal">Kembali</button>
            <button type="button" class="modal-success" :disabled="actionLoadingId === completeModal.item?.id" @click="confirmComplete">Selesaikan & Tampilkan Struk</button>
          </div>
        </div>
      </div>
    </Teleport>
  </section>
</template>

<script setup>
import { computed, onMounted, onUnmounted, ref } from 'vue'
import api from '../services/api'

const activeQueues = ref([])
const motorTypes = ref([])
const rfidTokens = ref([])
const systemConfig = ref({})

const form = ref({
  token_number: '',
  plat_number: '',
  motor_type: ''
})

const loadingQueues = ref(true)
const settingsLoading = ref(true)
const submitting = ref(false)
const refreshing = ref(false)
const actionLoadingId = ref(null)
const searchQuery = ref('')
const selectedStatus = ref('ALL')

const toast = ref({ show: false, type: 'success', message: '' })
let toastTimer = null
let pollTimer = null
let queueRequestRunning = false

const editModal = ref({ open: false, item: null, plat: '' })
const cancelModal = ref({ open: false, item: null })
const completeModal = ref({ open: false, item: null })

const serviceSteps = [
  { value: 'ANTRI', short: 'Antre' },
  { value: 'PROSES CUCI', short: 'Cuci' },
  { value: 'PENGERINGAN', short: 'Kering' },
  { value: 'FINISH', short: 'Finish' }
]

const statusFilters = [
  { value: 'ALL', label: 'Semua' },
  { value: 'ANTRI', label: 'Antre' },
  { value: 'PROSES CUCI', label: 'Cuci' },
  { value: 'PENGERINGAN', label: 'Kering' },
  { value: 'FINISH', label: 'Finish' }
]

const selectedMotor = computed(() =>
  motorTypes.value.find(item => item.name === form.value.motor_type) || null
)

const formReady = computed(() =>
  Boolean(form.value.token_number && form.value.plat_number.trim() && selectedMotor.value)
)

const availableTokenCount = computed(() =>
  rfidTokens.value.filter(token => isTokenAvailable(token)).length
)

const queueSummary = computed(() => ({
  antri: activeQueues.value.filter(item => item.status === 'ANTRI').length,
  proses: activeQueues.value.filter(item => ['PROSES CUCI', 'PENGERINGAN'].includes(item.status)).length,
  finish: activeQueues.value.filter(item => item.status === 'FINISH').length
}))

const filteredQueues = computed(() => {
  const query = searchQuery.value.trim().toUpperCase()

  return activeQueues.value.filter(item => {
    const matchesStatus = selectedStatus.value === 'ALL' || item.status === selectedStatus.value
    const matchesQuery = !query ||
      String(item.plat_number || '').toUpperCase().includes(query) ||
      String(item.token_number || '').toUpperCase().includes(query)

    return matchesStatus && matchesQuery
  })
})

const showToast = (message, type = 'success') => {
  clearTimeout(toastTimer)
  toast.value = { show: true, type, message }
  toastTimer = setTimeout(() => {
    toast.value.show = false
  }, 3500)
}

const normalizePlateInput = event => {
  form.value.plat_number = event.target.value.toUpperCase().replace(/\s+/g, ' ')
}

const normalizeEditPlate = event => {
  editModal.value.plat = event.target.value.toUpperCase().replace(/\s+/g, ' ')
}

const formatCurrency = value => {
  const number = Number(value || 0)
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0
  }).format(Number.isFinite(number) ? number : 0)
}

const formatQueueTime = value => {
  if (!value) return 'Waktu tidak tersedia'
  const normalized = String(value).replace(' ', 'T')
  const date = new Date(normalized)
  if (Number.isNaN(date.getTime())) return String(value)
  return `Masuk ${date.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}`
}

const statusIndex = status => {
  const index = serviceSteps.findIndex(step => step.value === status)
  return index < 0 ? 0 : index
}

const statusLabel = status => ({
  ANTRI: 'Menunggu',
  'PROSES CUCI': 'Proses Cuci',
  PENGERINGAN: 'Pengeringan',
  FINISH: 'Finish'
}[status] || status)

const statusClass = status => ({
  ANTRI: 'status-waiting',
  'PROSES CUCI': 'status-washing',
  PENGERINGAN: 'status-drying',
  FINISH: 'status-finish'
}[status] || 'status-waiting')

const isTokenDipakai = tokenNumber =>
  activeQueues.value.some(item => String(item.token_number) === String(tokenNumber))

const isTokenAvailable = token =>
  token.status === 'READY' && !isTokenDipakai(token.token_number)

const tokenStateLabel = token => {
  if (isTokenDipakai(token.token_number)) return 'Terpakai'
  if (token.status !== 'READY') return token.status
  return 'Siap'
}

const selectToken = tokenNumber => {
  form.value.token_number = String(tokenNumber)
}

const fetchSettingsData = async () => {
  settingsLoading.value = true
  try {
    const response = await api.getSettings()
    motorTypes.value = response.data.motor_types || []
    rfidTokens.value = response.data.rfid_tokens || []
    systemConfig.value = response.data.config || {}
  } catch (error) {
    console.error('Gagal mengambil pengaturan:', error)
    showToast('Data jenis motor dan kartu RFID tidak dapat dimuat.', 'error')
  } finally {
    settingsLoading.value = false
  }
}

const fetchQueues = async ({ silent = false } = {}) => {
  if (queueRequestRunning) return
  queueRequestRunning = true
  if (!silent) loadingQueues.value = true

  try {
    const response = await api.getQueues()
    const newData = Array.isArray(response.data) ? response.data : []

    // Jika antrean yang sebelumnya FINISH sudah tidak ada pada daftar aktif,
    // artinya transaksi dapat telah diselesaikan melalui tap RFID.
    activeQueues.value.forEach(oldItem => {
      if (oldItem.status === 'FINISH') {
        const stillActive = newData.find(item => String(item.id) === String(oldItem.id))
        if (!stillActive) cetakStruk(oldItem)
      }
    })

    activeQueues.value = newData
  } catch (error) {
    console.error('Gagal mengambil antrean:', error)
    if (!silent) showToast('Daftar antrean tidak dapat dimuat.', 'error')
  } finally {
    loadingQueues.value = false
    queueRequestRunning = false
  }
}

const manualRefresh = async () => {
  refreshing.value = true
  await Promise.all([
    fetchQueues({ silent: true }),
    fetchSettingsData()
  ])
  refreshing.value = false
}

const submitCheckin = async () => {
  if (!formReady.value || submitting.value) return

  const motor = selectedMotor.value
  const payload = {
    token_number: form.value.token_number,
    plat_number: form.value.plat_number.trim().toUpperCase(),
    motor_type: motor.name,
    price: motor.price
  }

  submitting.value = true
  try {
    const response = await api.checkin(payload)
    if (response.data.status === 'error') {
      showToast(response.data.message || 'Pendaftaran antrean gagal.', 'error')
      return
    }

    const registeredPlate = payload.plat_number
    const registeredToken = payload.token_number
    form.value = { token_number: '', plat_number: '', motor_type: '' }
    await fetchQueues({ silent: true })
    showToast(`${registeredPlate} berhasil didaftarkan dengan kartu #${registeredToken}.`)
  } catch (error) {
    console.error('Gagal check-in:', error)
    showToast('Terjadi kesalahan saat mendaftarkan kendaraan.', 'error')
  } finally {
    submitting.value = false
  }
}

const openEditModal = item => {
  editModal.value = { open: true, item, plat: item.plat_number }
}

const closeEditModal = () => {
  if (actionLoadingId.value) return
  editModal.value = { open: false, item: null, plat: '' }
}

const saveEditPlat = async () => {
  const item = editModal.value.item
  const newPlate = editModal.value.plat.trim().toUpperCase()
  if (!item || !newPlate) {
    showToast('Nomor polisi tidak boleh kosong.', 'error')
    return
  }
  if (newPlate === String(item.plat_number).toUpperCase()) {
    closeEditModal()
    return
  }

  actionLoadingId.value = item.id
  try {
    const response = await api.editPlat(item.id, newPlate)
    if (response.data.status === 'error') {
      showToast(response.data.message || 'Nomor polisi gagal diperbarui.', 'error')
      return
    }
    await fetchQueues({ silent: true })
    showToast(`Nomor polisi berhasil diubah menjadi ${newPlate}.`)
    editModal.value = { open: false, item: null, plat: '' }
  } catch (error) {
    console.error('Gagal mengedit plat:', error)
    showToast('Terjadi kesalahan saat memperbarui nomor polisi.', 'error')
  } finally {
    actionLoadingId.value = null
  }
}

const openCancelModal = item => {
  cancelModal.value = { open: true, item }
}

const closeCancelModal = () => {
  if (actionLoadingId.value) return
  cancelModal.value = { open: false, item: null }
}

const confirmCancel = async () => {
  const item = cancelModal.value.item
  if (!item) return

  actionLoadingId.value = item.id
  try {
    const response = await api.cancelQueue(item.id)
    if (response.data.status === 'error') {
      showToast(response.data.message || 'Antrean gagal dibatalkan.', 'error')
      return
    }

    activeQueues.value = activeQueues.value.filter(queue => String(queue.id) !== String(item.id))
    cancelModal.value = { open: false, item: null }
    showToast(`Antrean ${item.plat_number} berhasil dibatalkan.`)
  } catch (error) {
    console.error('Gagal membatalkan antrean:', error)
    showToast('Terjadi kesalahan saat membatalkan antrean.', 'error')
  } finally {
    actionLoadingId.value = null
  }
}

const openCompleteModal = item => {
  completeModal.value = { open: true, item }
}

const closeCompleteModal = () => {
  if (actionLoadingId.value) return
  completeModal.value = { open: false, item: null }
}

const confirmComplete = async () => {
  const item = completeModal.value.item
  if (!item) return

  actionLoadingId.value = item.id
  try {
    const response = await api.pay(item.id)
    if (response.data?.status === 'error') {
      showToast(response.data.message || 'Transaksi gagal diselesaikan.', 'error')
      return
    }

    activeQueues.value = activeQueues.value.filter(queue => String(queue.id) !== String(item.id))
    completeModal.value = { open: false, item: null }
    cetakStruk(item)
    showToast(`Transaksi ${item.plat_number} telah diselesaikan.`)
    await fetchQueues({ silent: true })
  } catch (error) {
    console.error('Gagal memproses transaksi:', error)
    showToast('Terjadi kesalahan saat menyelesaikan transaksi.', 'error')
  } finally {
    actionLoadingId.value = null
  }
}

const cetakStruk = item => {
  const footerText = systemConfig.value.receipt_footer || 'Terima Kasih!'
  alert(
    `🖨️ SIMULASI STRUK\n\n` +
    `GECKO WASH TOUCHLESS\n` +
    `Kartu: #${item.token_number}\n` +
    `Plat: ${item.plat_number}\n` +
    `Tipe: ${item.motor_type}\n` +
    `Total: ${formatCurrency(item.price)}\n\n` +
    `${footerText}`
  )
}

onMounted(async () => {
  await Promise.all([fetchSettingsData(), fetchQueues()])
  pollTimer = setInterval(() => fetchQueues({ silent: true }), 2000)
})

onUnmounted(() => {
  clearInterval(pollTimer)
  clearTimeout(toastTimer)
})
</script>

<style scoped>
.kasir-view {
  width: 100%;
  padding-bottom: 48px;
  color: #182033;
}

.kasir-view svg {
  width: 20px;
  height: 20px;
  fill: none;
  stroke: currentColor;
  stroke-width: 1.9;
  stroke-linecap: round;
  stroke-linejoin: round;
}

.summary-grid {
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: 14px;
  margin-bottom: 20px;
}

.summary-card {
  min-width: 0;
  padding: 17px 18px;
  background: #fff;
  border: 1px solid #e6e9ef;
  border-radius: 18px;
  display: flex;
  align-items: center;
  gap: 13px;
  box-shadow: 0 5px 18px rgba(30, 41, 59, 0.035);
}

.summary-icon {
  width: 43px;
  height: 43px;
  flex: 0 0 43px;
  border-radius: 13px;
  display: grid;
  place-items: center;
}

.summary-icon-blue { color: #2563eb; background: #eef4ff; }
.summary-icon-amber { color: #c67a05; background: #fff6df; }
.summary-icon-cyan { color: #087d9e; background: #e9f8fc; }
.summary-icon-green { color: #18895b; background: #eaf8f1; }
.summary-icon-violet { color: #6d51c8; background: #f2efff; }

.summary-card span {
  display: block;
  color: #7a8496;
  font-size: 12px;
  font-weight: 700;
  line-height: 1.25;
}

.summary-card strong {
  display: block;
  margin-top: 2px;
  color: #1b2436;
  font-size: 25px;
  line-height: 1;
}

.workspace-grid {
  display: grid;
  grid-template-columns: minmax(340px, 420px) minmax(0, 1fr);
  gap: 20px;
  align-items: start;
}

.panel {
  background: #fff;
  border: 1px solid #e4e8ef;
  border-radius: 22px;
  box-shadow: 0 8px 30px rgba(15, 23, 42, 0.045);
}

.registration-panel {
  padding: 24px;
  position: sticky;
  top: 24px;
}

.panel-heading,
.queue-heading {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
}

.eyebrow {
  display: block;
  margin-bottom: 7px;
  color: #3970d6;
  font-size: 11px;
  font-weight: 800;
  letter-spacing: .11em;
}

.panel-heading h2,
.queue-heading h2 {
  margin: 0;
  color: #171f31;
  font-size: 25px;
  line-height: 1.2;
  letter-spacing: -.02em;
}

.panel-heading p,
.queue-heading p {
  margin: 7px 0 0;
  color: #7b8494;
  font-size: 13px;
  line-height: 1.55;
}

.live-pill {
  flex: 0 0 auto;
  display: inline-flex;
  align-items: center;
  gap: 7px;
  padding: 7px 10px;
  border-radius: 999px;
  color: #18724f;
  background: #eef9f3;
  font-size: 11px;
  font-weight: 800;
}

.live-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: #23a66f;
  box-shadow: 0 0 0 4px rgba(35, 166, 111, .12);
}

.registration-form {
  display: grid;
  gap: 21px;
  margin-top: 24px;
}

.field-group {
  display: grid;
  gap: 8px;
}

.field-group label {
  color: #39445a;
  font-size: 13px;
  font-weight: 800;
}

.field-group small {
  color: #8c95a5;
  font-size: 11px;
  line-height: 1.45;
}

.input-shell,
.select-shell,
.search-shell {
  position: relative;
  display: flex;
  align-items: center;
}

.input-shell > svg {
  position: absolute;
  left: 14px;
  color: #8a94a7;
  pointer-events: none;
}

.input-shell input,
.select-shell select,
.search-shell input,
.modal-card input {
  width: 100%;
  border: 1px solid #dfe4ec;
  outline: none;
  background: #fbfcfe;
  color: #20283a;
  transition: border-color .18s ease, box-shadow .18s ease, background .18s ease;
}

.input-shell input,
.select-shell select {
  height: 50px;
  border-radius: 13px;
  padding: 0 14px;
}

.input-shell input {
  padding-left: 45px;
  text-transform: uppercase;
  font-weight: 700;
  letter-spacing: .025em;
}

.input-shell input:focus,
.select-shell select:focus,
.search-shell input:focus,
.modal-card input:focus {
  border-color: #79a0e8;
  background: #fff;
  box-shadow: 0 0 0 4px rgba(45, 101, 208, .09);
}

.select-shell select {
  appearance: none;
  padding-right: 44px;
  cursor: pointer;
}

.select-shell > svg {
  position: absolute;
  right: 14px;
  color: #7d8798;
  pointer-events: none;
}

.price-preview {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  border-radius: 11px;
  background: #f5f8fd;
  color: #6f7a8e;
  font-size: 12px;
}

.price-preview strong {
  color: #234f9f;
  font-size: 13px;
}

.field-title-row {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 12px;
}

.field-title-row > div {
  display: grid;
  gap: 4px;
}

.text-button {
  padding: 0;
  border: 0;
  background: transparent;
  color: #2f66ca;
  font-size: 11px;
  font-weight: 800;
  cursor: pointer;
}

.token-grid,
.token-skeleton-grid {
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: 8px;
}

.token-button {
  min-width: 0;
  height: 62px;
  padding: 7px 5px;
  border: 1px solid #dfe5ee;
  border-radius: 13px;
  background: #fff;
  color: #263147;
  cursor: pointer;
  transition: transform .15s ease, border-color .15s ease, background .15s ease, box-shadow .15s ease;
}

.token-button:hover:not(:disabled) {
  transform: translateY(-1px);
  border-color: #9bb8ec;
  box-shadow: 0 5px 13px rgba(47, 102, 202, .08);
}

.token-button.selected {
  border-color: #3971d5;
  background: #edf4ff;
  box-shadow: inset 0 0 0 1px #3971d5;
}

.token-button.unavailable {
  background: #f5f6f8;
  color: #adb4c0;
  cursor: not-allowed;
}

.token-number {
  display: block;
  font-size: 18px;
  font-weight: 850;
  line-height: 1.1;
}

.token-state {
  display: block;
  margin-top: 4px;
  color: #8390a3;
  font-size: 9px;
  font-weight: 700;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.token-button.selected .token-state { color: #3971d5; }

.token-skeleton {
  height: 62px;
  border-radius: 13px;
  background: linear-gradient(90deg, #f1f3f6 25%, #f8f9fb 37%, #f1f3f6 63%);
  background-size: 400% 100%;
  animation: shimmer 1.25s infinite;
}

.registration-summary {
  display: grid;
  grid-template-columns: 1fr .8fr 1fr;
  gap: 1px;
  padding: 1px;
  overflow: hidden;
  border: 1px solid #e4e8ef;
  border-radius: 13px;
  background: #e4e8ef;
}

.registration-summary > div {
  min-width: 0;
  padding: 10px 9px;
  background: #fafbfd;
}

.registration-summary span,
.registration-summary strong {
  display: block;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.registration-summary span {
  color: #8a93a2;
  font-size: 9px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: .05em;
}

.registration-summary strong {
  margin-top: 3px;
  color: #364155;
  font-size: 11px;
}

.registration-summary.ready {
  border-color: #ccdaef;
  background: #ccdaef;
}

.primary-button {
  width: 100%;
  min-height: 51px;
  border: 0;
  border-radius: 13px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 9px;
  background: linear-gradient(135deg, #2b61c3, #3977df);
  color: #fff;
  font-weight: 800;
  cursor: pointer;
  box-shadow: 0 9px 20px rgba(43, 97, 195, .17);
  transition: transform .16s ease, box-shadow .16s ease, opacity .16s ease;
}

.primary-button:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 11px 24px rgba(43, 97, 195, .22);
}

.primary-button:disabled {
  background: #bcc6d5;
  box-shadow: none;
  cursor: not-allowed;
  opacity: .72;
}

.queue-panel {
  padding: 24px;
  min-width: 0;
}

.refresh-button {
  height: 39px;
  padding: 0 13px;
  border: 1px solid #dfe4eb;
  border-radius: 11px;
  display: inline-flex;
  align-items: center;
  gap: 7px;
  background: #fff;
  color: #647086;
  font-size: 12px;
  font-weight: 800;
  cursor: pointer;
}

.refresh-button svg { width: 17px; height: 17px; }
.refresh-button:disabled { opacity: .65; cursor: wait; }

.queue-tools {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin: 22px 0 15px;
  padding: 12px;
  border-radius: 14px;
  background: #f7f9fc;
}

.search-shell {
  width: min(320px, 100%);
}

.search-shell > svg {
  position: absolute;
  left: 11px;
  width: 17px;
  height: 17px;
  color: #8c96a8;
}

.search-shell input {
  height: 38px;
  padding: 0 12px 0 36px;
  border-radius: 10px;
  background: #fff;
  font-size: 12px;
}

.status-filter {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 5px;
}

.status-filter button {
  height: 33px;
  padding: 0 10px;
  border: 1px solid transparent;
  border-radius: 9px;
  background: transparent;
  color: #7a8495;
  font-size: 10px;
  font-weight: 800;
  cursor: pointer;
}

.status-filter button.active {
  border-color: #d7e3f6;
  background: #fff;
  color: #2f65c5;
  box-shadow: 0 2px 7px rgba(30, 41, 59, .04);
}

.queue-list {
  display: grid;
  gap: 11px;
}

.queue-item {
  padding: 15px;
  border: 1px solid #e4e8ee;
  border-radius: 17px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 15px;
  background: #fff;
  transition: border-color .16s ease, box-shadow .16s ease;
}

.queue-item:hover {
  border-color: #d7deea;
  box-shadow: 0 6px 18px rgba(22, 34, 57, .045);
}

.queue-main {
  min-width: 0;
  flex: 1;
  display: flex;
  align-items: center;
  gap: 14px;
}

.token-badge {
  width: 58px;
  height: 58px;
  flex: 0 0 58px;
  border-radius: 15px;
  display: grid;
  align-content: center;
  justify-items: center;
  background: #edf4ff;
  color: #2e65c8;
}

.token-badge small {
  font-size: 8px;
  font-weight: 800;
  letter-spacing: .08em;
}

.token-badge strong {
  font-size: 20px;
  line-height: 1.05;
}

.vehicle-info {
  min-width: 0;
  flex: 1;
}

.vehicle-topline {
  display: flex;
  align-items: center;
  gap: 9px;
  min-width: 0;
}

.vehicle-topline h3 {
  min-width: 0;
  margin: 0;
  color: #1c2639;
  font-size: 16px;
  line-height: 1.25;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.status-badge {
  flex: 0 0 auto;
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 5px 8px;
  border-radius: 999px;
  font-size: 9px;
  font-weight: 850;
}

.status-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: currentColor;
}

.status-waiting { color: #a66606; background: #fff4d8; }
.status-washing { color: #1768b8; background: #eaf4ff; }
.status-drying { color: #7655b7; background: #f1ebff; }
.status-finish { color: #187850; background: #e7f7ef; }

.vehicle-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 11px;
  margin-top: 6px;
  color: #7c8799;
  font-size: 10px;
  font-weight: 600;
}

.vehicle-meta span {
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

.vehicle-meta svg {
  width: 13px;
  height: 13px;
}

.progress-track {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 0;
  margin-top: 13px;
  max-width: 420px;
}

.progress-step {
  position: relative;
  display: grid;
  justify-items: center;
  gap: 4px;
  color: #a7afbc;
}

.progress-step::before,
.progress-step::after {
  content: '';
  position: absolute;
  top: 5px;
  height: 2px;
  background: #e4e8ef;
  width: 50%;
  z-index: 0;
}

.progress-step::before { left: 0; }
.progress-step::after { right: 0; }
.progress-step:first-child::before,
.progress-step:last-child::after { display: none; }

.progress-step.done::before,
.progress-step.done::after,
.progress-step.current::before { background: #5c83cc; }

.progress-node {
  position: relative;
  z-index: 1;
  width: 11px;
  height: 11px;
  border: 2px solid #d7dce5;
  border-radius: 50%;
  background: #fff;
}

.progress-step.done .progress-node,
.progress-step.current .progress-node {
  border-color: #3e70ca;
  background: #3e70ca;
  box-shadow: 0 0 0 3px #edf3ff;
}

.progress-label {
  font-size: 8px;
  font-weight: 750;
}

.progress-step.done .progress-label,
.progress-step.current .progress-label { color: #5d6e89; }

.queue-actions {
  flex: 0 0 auto;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  flex-wrap: wrap;
  gap: 6px;
  max-width: 250px;
}

.action-button {
  min-height: 34px;
  padding: 0 10px;
  border: 1px solid #dfe4eb;
  border-radius: 9px;
  display: inline-flex;
  align-items: center;
  gap: 5px;
  background: #fff;
  color: #687489;
  font-size: 9px;
  font-weight: 800;
  cursor: pointer;
}

.action-button svg { width: 14px; height: 14px; }
.action-button.edit:hover { border-color: #e9c77f; color: #a16609; background: #fffaf0; }
.action-button.danger { border-color: #f0d6d6; color: #b34444; background: #fffafa; }
.action-button.complete { border-color: #cfe8dc; color: #16744e; background: #f2fbf6; }
.action-button:disabled { opacity: .55; cursor: wait; }

.queue-loading,
.empty-state {
  min-height: 300px;
  border: 1px dashed #dfe4ec;
  border-radius: 16px;
  display: grid;
  place-items: center;
  align-content: center;
  text-align: center;
  padding: 30px;
  color: #8792a3;
}

.queue-loading { gap: 10px; }
.queue-loading p { margin: 0; font-size: 12px; }

.empty-icon {
  width: 52px;
  height: 52px;
  border-radius: 15px;
  display: grid;
  place-items: center;
  background: #f2f5f9;
  color: #8b96a8;
}

.empty-state h3 {
  margin: 13px 0 4px;
  color: #4a566b;
  font-size: 16px;
}

.empty-state p {
  max-width: 350px;
  margin: 0;
  font-size: 11px;
  line-height: 1.55;
}

.spinner {
  width: 17px;
  height: 17px;
  border: 2px solid rgba(255,255,255,.42);
  border-top-color: currentColor;
  border-radius: 50%;
  animation: spin .7s linear infinite;
}

.spinner-dark {
  color: #4d6c9e;
  border-color: #dde3ec;
  border-top-color: #4d6c9e;
}

.spinning { animation: spin .75s linear infinite; }

.toast {
  position: fixed;
  right: 24px;
  bottom: 24px;
  z-index: 80;
  width: min(390px, calc(100vw - 32px));
  padding: 13px 14px;
  border: 1px solid #dfe5ed;
  border-radius: 15px;
  display: grid;
  grid-template-columns: auto 1fr auto;
  align-items: center;
  gap: 10px;
  background: #fff;
  box-shadow: 0 16px 45px rgba(15, 23, 42, .16);
}

.toast-icon {
  width: 32px;
  height: 32px;
  border-radius: 10px;
  display: grid;
  place-items: center;
}

.toast-icon svg { width: 17px; height: 17px; }
.toast-success .toast-icon { color: #16805a; background: #eaf8f1; }
.toast-error .toast-icon { color: #bd4c4c; background: #fff0f0; }

.toast strong { display: block; color: #2b3548; font-size: 12px; }
.toast p { margin: 2px 0 0; color: #727e91; font-size: 11px; line-height: 1.4; }
.toast > button { border: 0; background: transparent; color: #9aa3b1; font-size: 20px; cursor: pointer; }

.toast-enter-active,
.toast-leave-active { transition: all .22s ease; }
.toast-enter-from,
.toast-leave-to { opacity: 0; transform: translateY(12px); }

.token-skeleton-grid { margin-top: 1px; }

@keyframes spin { to { transform: rotate(360deg); } }
@keyframes shimmer { 0% { background-position: 100% 0; } 100% { background-position: 0 0; } }

@media (max-width: 1320px) {
  .summary-grid { grid-template-columns: repeat(3, minmax(0, 1fr)); }
  .workspace-grid { grid-template-columns: minmax(320px, 380px) minmax(0, 1fr); }
  .queue-item { align-items: flex-start; flex-direction: column; }
  .queue-actions { width: 100%; max-width: none; justify-content: flex-start; padding-left: 72px; }
}

@media (max-width: 1080px) {
  .workspace-grid { grid-template-columns: 1fr; }
  .registration-panel { position: static; }
  .registration-form { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .token-field,
  .registration-summary,
  .primary-button { grid-column: 1 / -1; }
  .token-grid,
  .token-skeleton-grid { grid-template-columns: repeat(10, minmax(0, 1fr)); }
}

@media (max-width: 860px) {
  .summary-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .queue-tools { align-items: stretch; flex-direction: column; }
  .search-shell { width: 100%; }
  .status-filter { justify-content: flex-start; }
  .token-grid,
  .token-skeleton-grid { grid-template-columns: repeat(5, minmax(0, 1fr)); }
}

@media (max-width: 640px) {
  .kasir-view { padding-bottom: 28px; }
  .summary-grid { gap: 9px; margin-bottom: 12px; }
  .summary-card { padding: 13px; border-radius: 15px; gap: 9px; }
  .summary-icon { width: 36px; height: 36px; flex-basis: 36px; border-radius: 11px; }
  .summary-icon svg { width: 17px; height: 17px; }
  .summary-card span { font-size: 9px; }
  .summary-card strong { font-size: 20px; }

  .panel { border-radius: 18px; }
  .registration-panel,
  .queue-panel { padding: 17px; }
  .panel-heading h2,
  .queue-heading h2 { font-size: 21px; }
  .panel-heading p,
  .queue-heading p { font-size: 11px; }
  .registration-form { grid-template-columns: 1fr; gap: 17px; }
  .token-field,
  .registration-summary,
  .primary-button { grid-column: auto; }

  .queue-heading { flex-direction: column; }
  .refresh-button { align-self: flex-start; }
  .queue-main { align-items: flex-start; }
  .token-badge { width: 50px; height: 50px; flex-basis: 50px; border-radius: 13px; }
  .token-badge strong { font-size: 17px; }
  .vehicle-topline { align-items: flex-start; flex-direction: column; gap: 5px; }
  .vehicle-meta { gap: 7px; }
  .queue-actions { padding-left: 0; }
  .action-button { flex: 1 1 auto; justify-content: center; }

  .progress-track { margin-left: -5px; }
  .progress-label { font-size: 7px; }

  .toast { right: 16px; bottom: 16px; }
}

@media (max-width: 440px) {
  .summary-grid { grid-template-columns: 1fr 1fr; }
  .summary-card:last-child { grid-column: 1 / -1; }
  .token-grid,
  .token-skeleton-grid { grid-template-columns: repeat(5, minmax(0, 1fr)); gap: 6px; }
  .token-button,
  .token-skeleton { height: 55px; border-radius: 11px; }
  .token-number { font-size: 15px; }
  .token-state { font-size: 8px; }
  .registration-summary { grid-template-columns: 1fr 1fr; }
  .registration-summary > div:last-child { grid-column: 1 / -1; }
  .queue-tools { margin-top: 18px; }
  .status-filter { gap: 4px; }
  .status-filter button { padding: 0 8px; }
}
</style>

<style>
/* Modal dipindahkan ke <body> melalui Teleport, sehingga style tidak dapat scoped. */
.modal-backdrop {
  position: fixed;
  inset: 0;
  z-index: 100;
  padding: 20px;
  display: grid;
  place-items: center;
  background: rgba(19, 28, 43, .48);
  backdrop-filter: blur(5px);
}

.modal-card {
  width: min(430px, 100%);
  padding: 25px;
  border: 1px solid #e5e8ee;
  border-radius: 22px;
  background: #fff;
  box-shadow: 0 25px 70px rgba(12, 21, 38, .22);
  color: #20293a;
}

.modal-icon {
  width: 44px;
  height: 44px;
  border-radius: 13px;
  display: grid;
  place-items: center;
  margin-bottom: 14px;
}

.modal-icon svg {
  width: 21px;
  height: 21px;
  fill: none;
  stroke: currentColor;
  stroke-width: 2;
  stroke-linecap: round;
  stroke-linejoin: round;
}

.modal-icon-amber { color: #a66b09; background: #fff5df; }
.modal-icon-red { color: #b64646; background: #fff0f0; }
.modal-icon-green { color: #167a53; background: #eaf8f1; }

.modal-card h3 { margin: 0; font-size: 21px; }
.modal-card > p { margin: 7px 0 18px; color: #758094; font-size: 13px; line-height: 1.55; }
.modal-card label { display: block; margin-bottom: 7px; color: #3e495e; font-size: 12px; font-weight: 800; }
.modal-card input { height: 48px; padding: 0 13px; border-radius: 12px; text-transform: uppercase; font-weight: 700; }

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 21px;
}

.modal-actions button {
  min-height: 42px;
  padding: 0 14px;
  border-radius: 11px;
  font-size: 12px;
  font-weight: 800;
  cursor: pointer;
}

.modal-secondary { border: 1px solid #dfe4eb; background: #fff; color: #687387; }
.modal-primary { border: 1px solid #3268c9; background: #3268c9; color: #fff; }
.modal-danger { border: 1px solid #c74e4e; background: #c74e4e; color: #fff; }
.modal-success { border: 1px solid #1d8a5f; background: #1d8a5f; color: #fff; }
.modal-actions button:disabled { opacity: .6; cursor: wait; }

.transaction-preview {
  overflow: hidden;
  border: 1px solid #e5e8ee;
  border-radius: 13px;
}

.transaction-preview > div {
  display: flex;
  justify-content: space-between;
  gap: 15px;
  padding: 10px 12px;
  border-bottom: 1px solid #edf0f4;
  font-size: 12px;
}

.transaction-preview > div:last-child { border-bottom: 0; }
.transaction-preview span { color: #7d8798; }
.transaction-preview strong { color: #2a3448; text-align: right; }
.transaction-preview .transaction-total { background: #f2faf6; }
.transaction-preview .transaction-total strong { color: #13734d; font-size: 14px; }

.modal-note {
  margin-top: 12px;
  padding: 10px 11px;
  border-radius: 10px;
  background: #f5f7fa;
  color: #7a8495;
  font-size: 10px;
  line-height: 1.5;
}

@media (max-width: 520px) {
  .modal-backdrop { padding: 12px; align-items: end; }
  .modal-card { padding: 21px; border-radius: 20px 20px 14px 14px; }
  .modal-actions { flex-direction: column-reverse; }
  .modal-actions button { width: 100%; }
}
</style>
