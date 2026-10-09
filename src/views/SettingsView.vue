<template>
  <section class="settings-page">
    <header class="page-header">
      <div>
        <p class="eyebrow">PENGATURAN</p>
        <h1>Pengaturan Sistem</h1>
        <p class="subtitle">Kelola tarif layanan, kartu RFID, dan informasi pelayanan Gecko Wash.</p>
      </div>

      <button class="refresh-btn" type="button" :disabled="loading" @click="fetchAllSettings">
        <span :class="{ spin: loading }">↻</span>
        <span class="refresh-text">{{ loading ? 'Memuat' : 'Perbarui' }}</span>
      </button>
    </header>

    <div v-if="errorMessage" class="alert error-alert">
      <div>
        <strong>Data pengaturan belum dapat dimuat.</strong>
        <p>{{ errorMessage }}</p>
      </div>
      <button type="button" @click="fetchAllSettings">Coba lagi</button>
    </div>

    <nav class="settings-tabs" aria-label="Menu pengaturan">
      <button
        v-for="tab in tabs"
        :key="tab.key"
        type="button"
        class="tab-btn"
        :class="{ active: activeTab === tab.key }"
        @click="activeTab = tab.key"
      >
        <span class="tab-icon">{{ tab.icon }}</span>
        <span>{{ tab.label }}</span>
      </button>
    </nav>

    <!-- TARIF -->
    <div v-show="activeTab === 'tarif'" class="settings-panel">
      <div class="panel-heading">
        <div>
          <span class="section-badge">Tarif layanan</span>
          <h2>Jenis Motor & Tarif</h2>
          <p>Tarif ini digunakan operator ketika mendaftarkan kendaraan pada halaman Kasir.</p>
        </div>
      </div>

      <form class="motor-form" @submit.prevent="simpanTipeMotor">
        <label class="field-group">
          <span>Nama jenis motor</span>
          <input
            v-model.trim="formMotor.name"
            type="text"
            maxlength="100"
            autocomplete="off"
            placeholder="Contoh: Motor Matic / Bebek"
          />
        </label>

        <label class="field-group">
          <span>Tarif</span>
          <div class="money-input">
            <span>Rp</span>
            <input
              v-model.number="formMotor.price"
              type="number"
              min="0"
              step="1000"
              inputmode="numeric"
              placeholder="20000"
            />
          </div>
        </label>

        <button class="primary-btn add-motor-btn" type="submit" :disabled="savingMotor">
          {{ savingMotor ? 'Menyimpan...' : '+ Tambah Tarif' }}
        </button>
      </form>

      <div v-if="motorTypes.length" class="motor-list">
        <article v-for="item in motorTypes" :key="item.id" class="motor-item">
          <div class="motor-icon">🏍️</div>
          <div class="motor-info">
            <strong>{{ item.name }}</strong>
            <span>{{ formatRupiah(item.price) }}</span>
          </div>
          <button class="danger-text-btn" type="button" @click="hapusTipeMotor(item)">Hapus</button>
        </article>
      </div>

      <div v-else-if="!loading" class="empty-state compact">
        <div class="empty-icon">🏍️</div>
        <strong>Belum ada tarif layanan</strong>
        <p>Tambahkan jenis motor dan tarif agar dapat dipilih pada halaman Kasir.</p>
      </div>
    </div>

    <!-- RFID -->
    <div v-show="activeTab === 'rfid'" class="settings-panel">
      <div class="panel-heading rfid-heading">
        <div>
          <span class="section-badge">Kartu antrean</span>
          <h2>Manajemen Kartu RFID</h2>
          <p>
            Tambah kartu baru, ganti UID kartu fisik, atau hapus kartu yang sudah tidak digunakan.
            Nomor kartu menjadi identitas yang dipilih operator di halaman Kasir.
          </p>
        </div>

        <button class="primary-btn add-rfid-btn" type="button" @click="openAddRfidModal">
          + Tambah RFID
        </button>
      </div>

      <div class="rfid-note">
        <span class="note-icon">i</span>
        <p>
          Jika kartu fisik hilang, Anda tidak perlu menghapus nomor kartunya. Gunakan <strong>Ubah UID</strong>
          agar nomor kartu tetap sama tetapi dipasangkan dengan RFID pengganti.
        </p>
      </div>

      <div v-if="rfidTokens.length" class="rfid-grid">
        <article
          v-for="rfid in rfidTokens"
          :key="rfid.token_number"
          class="rfid-card"
          :class="{ 'is-used': isTokenDipakai(rfid.token_number) }"
        >
          <div class="rfid-card-top">
            <div class="token-number">{{ rfid.token_number }}</div>
            <span
              class="mapping-state"
              :class="{
                used: isTokenDipakai(rfid.token_number),
                missing: !rfid.rfid_uid
              }"
            >
              {{ rfidStateLabel(rfid) }}
            </span>
          </div>

          <div class="uid-block">
            <span>UID RFID</span>
            <strong>{{ rfid.rfid_uid || 'Belum diatur' }}</strong>
          </div>

          <div v-if="activeVehicleForToken(rfid.token_number)" class="active-rfid-info">
            Dipakai: {{ activeVehicleForToken(rfid.token_number).plat_number }}
          </div>

          <div class="rfid-actions">
            <button class="secondary-btn" type="button" @click="openEditRfidModal(rfid)">
              {{ rfid.rfid_uid ? 'Ubah UID' : 'Atur UID' }}
            </button>

            <button
              class="danger-btn"
              type="button"
              :disabled="isTokenDipakai(rfid.token_number) || deletingToken === String(rfid.token_number)"
              :title="isTokenDipakai(rfid.token_number) ? 'Kartu sedang digunakan oleh antrean aktif' : 'Hapus kartu RFID'"
              @click="hapusRfid(rfid)"
            >
              {{ deletingToken === String(rfid.token_number) ? 'Menghapus...' : 'Hapus' }}
            </button>
          </div>
        </article>
      </div>

      <div v-else-if="!loading" class="empty-state compact">
        <div class="empty-icon">💳</div>
        <strong>Belum ada kartu RFID</strong>
        <p>Tekan “Tambah RFID” untuk mendaftarkan kartu pertama.</p>
      </div>
    </div>

    <!-- SISTEM -->
    <div v-show="activeTab === 'sistem'" class="settings-panel">
      <div class="panel-heading">
        <div>
          <span class="section-badge">Pengaturan umum</span>
          <h2>Informasi Pelayanan</h2>
          <p>Atur teks penutup yang digunakan pada simulasi struk penyelesaian transaksi.</p>
        </div>
      </div>

      <form class="system-form" @submit.prevent="simpanPengaturanUmum">
        <label class="field-group full-width">
          <span>Teks footer struk</span>
          <textarea
            v-model="systemConfig.receipt_footer"
            rows="4"
            maxlength="255"
            placeholder="Terima kasih telah mencuci di Gecko Wash Touchless."
          ></textarea>
          <small>{{ systemConfig.receipt_footer.length }}/255 karakter</small>
        </label>

        <div class="form-actions">
          <button class="primary-btn" type="submit" :disabled="savingSystem">
            {{ savingSystem ? 'Menyimpan...' : 'Simpan Pengaturan' }}
          </button>
        </div>
      </form>
    </div>

    <!-- MODAL TAMBAH RFID -->
    <Teleport to="body">
      <div v-if="addRfidModal.open" class="modal-backdrop" @click.self="closeAddRfidModal">
        <div class="modal-card" role="dialog" aria-modal="true" aria-labelledby="add-rfid-title">
          <div class="modal-header">
            <div>
              <p class="modal-eyebrow">KARTU RFID BARU</p>
              <h3 id="add-rfid-title">Tambah Kartu RFID</h3>
            </div>
            <button class="modal-close" type="button" aria-label="Tutup" @click="closeAddRfidModal">×</button>
          </div>

          <div class="add-rfid-form">
            <label class="field-group full-width">
              <span>Nomor kartu</span>
              <input
                ref="tokenInput"
                v-model="addRfidModal.token_number"
                type="text"
                inputmode="numeric"
                autocomplete="off"
                maxlength="2"
                placeholder="Contoh: 11"
                @input="sanitizeTokenBaru"
              />
              <small>Gunakan nomor 1–99. Nomor satu digit otomatis disimpan menjadi 01, 02, dan seterusnya.</small>
            </label>

            <label class="field-group full-width">
              <span>UID RFID</span>
              <input
                v-model="addRfidModal.rfid_uid"
                type="text"
                inputmode="numeric"
                autocomplete="off"
                maxlength="20"
                placeholder="Contoh: 2230508714"
                @input="sanitizeUidBaru"
                @keyup.enter="tambahRfid"
              />
              <small>UID harus berupa angka 8–20 digit.</small>
            </label>
          </div>

          <div v-if="addRfidModal.error" class="modal-error">{{ addRfidModal.error }}</div>

          <div class="modal-actions">
            <button class="secondary-btn" type="button" :disabled="savingRfid" @click="closeAddRfidModal">
              Batal
            </button>
            <button class="primary-btn" type="button" :disabled="savingRfid" @click="tambahRfid">
              {{ savingRfid ? 'Menambahkan...' : 'Tambah RFID' }}
            </button>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- MODAL UBAH UID -->
    <Teleport to="body">
      <div v-if="editRfidModal.open" class="modal-backdrop" @click.self="closeEditRfidModal">
        <div class="modal-card" role="dialog" aria-modal="true" aria-labelledby="edit-rfid-title">
          <div class="modal-header">
            <div>
              <p class="modal-eyebrow">KARTU RFID {{ editRfidModal.token_number }}</p>
              <h3 id="edit-rfid-title">{{ editRfidModal.current_uid ? 'Ganti UID RFID' : 'Atur UID RFID' }}</h3>
            </div>
            <button class="modal-close" type="button" aria-label="Tutup" @click="closeEditRfidModal">×</button>
          </div>

          <div v-if="editRfidModal.current_uid" class="current-uid">
            <span>UID saat ini</span>
            <strong>{{ editRfidModal.current_uid }}</strong>
          </div>

          <div v-if="activeVehicleForToken(editRfidModal.token_number)" class="modal-warning">
            Kartu ini sedang digunakan oleh {{ activeVehicleForToken(editRfidModal.token_number).plat_number }}.
            Mengganti UID akan membuat kartu pengganti langsung menjadi identitas antrean yang sama.
          </div>

          <label class="field-group full-width">
            <span>UID RFID baru</span>
            <input
              ref="uidInput"
              v-model="editRfidModal.new_uid"
              type="text"
              inputmode="numeric"
              autocomplete="off"
              maxlength="20"
              placeholder="Contoh: 2230508714"
              @input="sanitizeEditUid"
              @keyup.enter="simpanRfidUid"
            />
            <small>Masukkan UID kartu fisik pengganti.</small>
          </label>

          <div v-if="editRfidModal.error" class="modal-error">{{ editRfidModal.error }}</div>

          <div class="modal-actions">
            <button class="secondary-btn" type="button" :disabled="savingRfid" @click="closeEditRfidModal">
              Batal
            </button>
            <button class="primary-btn" type="button" :disabled="savingRfid" @click="simpanRfidUid">
              {{ savingRfid ? 'Menyimpan...' : 'Simpan UID' }}
            </button>
          </div>
        </div>
      </div>
    </Teleport>

    <Transition name="toast">
      <div v-if="toast.show" class="toast" :class="toast.type">
        <span>{{ toast.type === 'success' ? '✓' : '!' }}</span>
        <p>{{ toast.message }}</p>
      </div>
    </Transition>
  </section>
</template>

<script setup>
import { nextTick, onMounted, ref } from 'vue'
import api from '../services/api'

const tabs = [
  { key: 'tarif', label: 'Tarif', icon: '🏍️' },
  { key: 'rfid', label: 'RFID', icon: '💳' },
  { key: 'sistem', label: 'Sistem', icon: '⚙️' }
]

const activeTab = ref('tarif')
const loading = ref(false)
const errorMessage = ref('')
const savingMotor = ref(false)
const savingRfid = ref(false)
const savingSystem = ref(false)
const deletingToken = ref('')

const motorTypes = ref([])
const rfidTokens = ref([])
const activeQueues = ref([])
const systemConfig = ref({ receipt_footer: '' })
const formMotor = ref({ name: '', price: '' })

const tokenInput = ref(null)
const uidInput = ref(null)

const toast = ref({ show: false, type: 'success', message: '' })
let toastTimer = null

const addRfidModal = ref({
  open: false,
  token_number: '',
  rfid_uid: '',
  error: ''
})

const editRfidModal = ref({
  open: false,
  token_number: '',
  current_uid: '',
  new_uid: '',
  error: ''
})

const showToast = (message, type = 'success') => {
  clearTimeout(toastTimer)
  toast.value = { show: true, type, message }
  toastTimer = setTimeout(() => {
    toast.value.show = false
  }, 3000)
}

const formatRupiah = (value) => {
  const amount = Number(value || 0)
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0
  }).format(amount)
}

const normalizeToken = (value) => {
  const number = Number.parseInt(String(value || ''), 10)
  if (!Number.isInteger(number) || number < 1 || number > 99) return ''
  return String(number).padStart(2, '0')
}

const activeVehicleForToken = (tokenNumber) =>
  activeQueues.value.find(item => String(item.token_number) === String(tokenNumber)) || null

const isTokenDipakai = (tokenNumber) => Boolean(activeVehicleForToken(tokenNumber))

const rfidStateLabel = (rfid) => {
  if (isTokenDipakai(rfid.token_number)) return 'Sedang dipakai'
  if (!rfid.rfid_uid) return 'Belum diatur'
  return 'Terhubung'
}

const fetchAllSettings = async () => {
  loading.value = true
  errorMessage.value = ''

  try {
    const [settingsResponse, queueResponse] = await Promise.all([
      api.getSettings(),
      api.getQueues()
    ])

    const data = settingsResponse.data || {}
    motorTypes.value = Array.isArray(data.motor_types) ? data.motor_types : []
    rfidTokens.value = Array.isArray(data.rfid_tokens)
      ? [...data.rfid_tokens].sort((a, b) =>
          String(a.token_number).localeCompare(String(b.token_number), undefined, { numeric: true })
        )
      : []

    systemConfig.value = {
      receipt_footer: data.config?.receipt_footer || ''
    }

    activeQueues.value = Array.isArray(queueResponse.data) ? queueResponse.data : []
  } catch (error) {
    console.error('Gagal memuat pengaturan:', error)
    errorMessage.value = error?.response?.data?.message || 'Periksa koneksi ke API Gecko Wash, kemudian coba kembali.'
  } finally {
    loading.value = false
  }
}

const simpanTipeMotor = async () => {
  const name = formMotor.value.name.trim()
  const price = Number(formMotor.value.price)

  if (!name) {
    showToast('Nama jenis motor harus diisi.', 'error')
    return
  }

  if (!Number.isFinite(price) || price <= 0) {
    showToast('Tarif harus lebih dari Rp0.', 'error')
    return
  }

  savingMotor.value = true
  try {
    const response = await api.saveMotorType({ name, price })
    if (response.data?.status === 'error') throw new Error(response.data.message)

    formMotor.value = { name: '', price: '' }
    await fetchAllSettings()
    showToast('Tarif layanan berhasil ditambahkan.')
  } catch (error) {
    console.error('Gagal menyimpan tarif:', error)
    showToast(error?.response?.data?.message || error.message || 'Tarif belum berhasil disimpan.', 'error')
  } finally {
    savingMotor.value = false
  }
}

const hapusTipeMotor = async (item) => {
  if (!window.confirm(`Hapus tarif "${item.name}"?`)) return

  try {
    const response = await api.deleteMotorType(item.id)
    if (response.data?.status === 'error') throw new Error(response.data.message)

    await fetchAllSettings()
    showToast('Tarif layanan berhasil dihapus.')
  } catch (error) {
    console.error('Gagal menghapus tarif:', error)
    showToast(error?.response?.data?.message || error.message || 'Tarif belum berhasil dihapus.', 'error')
  }
}

// =========================
// TAMBAH RFID
// =========================
const openAddRfidModal = async () => {
  addRfidModal.value = {
    open: true,
    token_number: '',
    rfid_uid: '',
    error: ''
  }

  await nextTick()
  tokenInput.value?.focus()
}

const closeAddRfidModal = () => {
  if (savingRfid.value) return
  addRfidModal.value.open = false
}

const sanitizeTokenBaru = () => {
  addRfidModal.value.token_number = String(addRfidModal.value.token_number || '').replace(/\D/g, '').slice(0, 2)
  addRfidModal.value.error = ''
}

const sanitizeUidBaru = () => {
  addRfidModal.value.rfid_uid = String(addRfidModal.value.rfid_uid || '').replace(/\D/g, '').slice(0, 20)
  addRfidModal.value.error = ''
}

const tambahRfid = async () => {
  const token = normalizeToken(addRfidModal.value.token_number)
  const uid = String(addRfidModal.value.rfid_uid || '').trim()

  if (!token) {
    addRfidModal.value.error = 'Nomor kartu harus berupa angka 1–99.'
    return
  }

  if (!/^\d{8,20}$/.test(uid)) {
    addRfidModal.value.error = 'UID RFID harus berupa angka 8–20 digit.'
    return
  }

  if (rfidTokens.value.some(item => String(item.token_number) === token)) {
    addRfidModal.value.error = `Kartu #${token} sudah terdaftar.`
    return
  }

  const duplicateUid = rfidTokens.value.find(item => String(item.rfid_uid || '') === uid)
  if (duplicateUid) {
    addRfidModal.value.error = `UID tersebut sudah digunakan oleh kartu #${duplicateUid.token_number}.`
    return
  }

  savingRfid.value = true
  addRfidModal.value.error = ''

  try {
    const response = await api.addRfid({
      token_number: token,
      rfid_uid: uid
    })

    if (response.data?.status === 'error') {
      addRfidModal.value.error = response.data.message || 'Kartu RFID gagal ditambahkan.'
      return
    }

    addRfidModal.value.open = false
    await fetchAllSettings()
    showToast(response.data?.message || `Kartu RFID #${token} berhasil ditambahkan.`)
  } catch (error) {
    console.error('Gagal menambahkan RFID:', error)
    addRfidModal.value.error = error?.response?.data?.message || 'Kartu RFID belum berhasil ditambahkan.'
  } finally {
    savingRfid.value = false
  }
}

// =========================
// UBAH UID RFID
// =========================
const openEditRfidModal = async (rfid) => {
  editRfidModal.value = {
    open: true,
    token_number: String(rfid.token_number),
    current_uid: String(rfid.rfid_uid || ''),
    new_uid: '',
    error: ''
  }

  await nextTick()
  uidInput.value?.focus()
}

const closeEditRfidModal = () => {
  if (savingRfid.value) return
  editRfidModal.value.open = false
}

const sanitizeEditUid = () => {
  editRfidModal.value.new_uid = String(editRfidModal.value.new_uid || '').replace(/\D/g, '').slice(0, 20)
  editRfidModal.value.error = ''
}

const simpanRfidUid = async () => {
  const uid = String(editRfidModal.value.new_uid || '').trim()
  const token = String(editRfidModal.value.token_number)

  if (!/^\d{8,20}$/.test(uid)) {
    editRfidModal.value.error = 'UID RFID harus berupa angka 8–20 digit.'
    return
  }

  if (uid === editRfidModal.value.current_uid) {
    editRfidModal.value.error = 'UID baru sama dengan UID yang sedang digunakan.'
    return
  }

  const duplicate = rfidTokens.value.find(
    item => String(item.rfid_uid || '') === uid && String(item.token_number) !== token
  )

  if (duplicate) {
    editRfidModal.value.error = `UID tersebut sudah digunakan oleh kartu #${duplicate.token_number}.`
    return
  }

  savingRfid.value = true
  editRfidModal.value.error = ''

  try {
    const response = await api.updateRfidUid({
      token_number: token,
      rfid_uid: uid
    })

    if (response.data?.status === 'error') {
      editRfidModal.value.error = response.data.message || 'UID RFID gagal diperbarui.'
      return
    }

    editRfidModal.value.open = false
    await fetchAllSettings()
    showToast(response.data?.message || `UID kartu #${token} berhasil diperbarui.`)
  } catch (error) {
    console.error('Gagal memperbarui UID RFID:', error)
    editRfidModal.value.error = error?.response?.data?.message || 'UID RFID belum berhasil diperbarui.'
  } finally {
    savingRfid.value = false
  }
}

// =========================
// HAPUS RFID
// =========================
const hapusRfid = async (rfid) => {
  const token = String(rfid.token_number)

  if (isTokenDipakai(token)) {
    const vehicle = activeVehicleForToken(token)
    showToast(`Kartu #${token} sedang digunakan oleh ${vehicle?.plat_number || 'antrean aktif'} dan tidak dapat dihapus.`, 'error')
    return
  }

  const ok = window.confirm(
    `Hapus kartu RFID #${token}?\n\nUID: ${rfid.rfid_uid || '-'}\n\nRiwayat transaksi lama tidak ikut terhapus.`
  )
  if (!ok) return

  deletingToken.value = token

  try {
    const response = await api.deleteRfid(token)
    if (response.data?.status === 'error') throw new Error(response.data.message)

    await fetchAllSettings()
    showToast(response.data?.message || `Kartu RFID #${token} berhasil dihapus.`)
  } catch (error) {
    console.error('Gagal menghapus RFID:', error)
    showToast(error?.response?.data?.message || error.message || 'Kartu RFID belum berhasil dihapus.', 'error')
  } finally {
    deletingToken.value = ''
  }
}

const simpanPengaturanUmum = async () => {
  const footer = String(systemConfig.value.receipt_footer || '').trim()

  if (!footer) {
    showToast('Teks footer struk tidak boleh kosong.', 'error')
    return
  }

  savingSystem.value = true
  try {
    const response = await api.saveSystemConfig({ receipt_footer: footer })
    if (response.data?.status === 'error') throw new Error(response.data.message)

    systemConfig.value.receipt_footer = footer
    showToast(response.data?.message || 'Pengaturan umum berhasil disimpan.')
  } catch (error) {
    console.error('Gagal menyimpan pengaturan umum:', error)
    showToast(error?.response?.data?.message || error.message || 'Pengaturan umum belum berhasil disimpan.', 'error')
  } finally {
    savingSystem.value = false
  }
}

onMounted(fetchAllSettings)
</script>

<style scoped>
.settings-page {
  width: 100%;
  max-width: 1080px;
  margin: 0 auto;
  padding: 0 0 28px;
  color: #172033;
}

.page-header,
.panel-heading,
.rfid-card-top,
.rfid-actions,
.modal-header,
.modal-actions,
.form-actions {
  display: flex;
}

.page-header {
  align-items: flex-start;
  justify-content: space-between;
  gap: 18px;
  margin-bottom: 18px;
}

.eyebrow,
.modal-eyebrow {
  margin: 0 0 5px;
  color: #7a8496;
  font-size: 11px;
  font-weight: 800;
  letter-spacing: .14em;
}

.page-header h1 {
  margin: 0;
  font-size: clamp(24px, 3vw, 32px);
  letter-spacing: -.035em;
}

.subtitle {
  max-width: 650px;
  margin: 7px 0 0;
  color: #6b7485;
  line-height: 1.55;
}

button,
input,
textarea {
  font: inherit;
}

button { cursor: pointer; }
button:disabled { cursor: not-allowed; opacity: .55; }

.refresh-btn,
.primary-btn,
.secondary-btn,
.danger-btn,
.danger-text-btn,
.tab-btn,
.modal-close {
  border: 0;
}

.refresh-btn {
  flex: 0 0 auto;
  display: inline-flex;
  align-items: center;
  gap: 7px;
  min-height: 42px;
  padding: 0 14px;
  border: 1px solid #d9dee7;
  border-radius: 11px;
  background: #fff;
  color: #344054;
  font-weight: 700;
}

.spin { display: inline-block; animation: spin .8s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }

.alert {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
  margin-bottom: 16px;
  padding: 14px 16px;
  border-radius: 12px;
}

.error-alert {
  border: 1px solid #fecaca;
  background: #fff7f7;
  color: #9f1d1d;
}

.alert p { margin: 4px 0 0; font-size: 13px; }
.alert button {
  flex: 0 0 auto;
  padding: 8px 12px;
  border: 0;
  border-radius: 8px;
  background: #9f1d1d;
  color: #fff;
  font-weight: 700;
}

.settings-tabs {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 6px;
  margin-bottom: 14px;
  padding: 5px;
  border: 1px solid #e1e5ec;
  border-radius: 14px;
  background: #f3f5f8;
}

.tab-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  min-height: 44px;
  padding: 8px 12px;
  border-radius: 10px;
  background: transparent;
  color: #657084;
  font-weight: 750;
}

.tab-btn.active {
  background: #fff;
  color: #172033;
  box-shadow: 0 2px 9px rgba(22, 34, 51, .08);
}

.tab-icon { font-size: 17px; }

.settings-panel {
  padding: clamp(18px, 3vw, 26px);
  border: 1px solid #e0e5ec;
  border-radius: 18px;
  background: #fff;
  box-shadow: 0 8px 28px rgba(28, 40, 58, .045);
}

.panel-heading {
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 22px;
}

.panel-heading h2 {
  margin: 6px 0 5px;
  font-size: clamp(20px, 2.5vw, 25px);
  letter-spacing: -.025em;
}

.panel-heading p {
  max-width: 720px;
  margin: 0;
  color: #70798a;
  line-height: 1.55;
}

.section-badge {
  display: inline-flex;
  align-items: center;
  min-height: 24px;
  padding: 0 9px;
  border-radius: 999px;
  background: #eef4ff;
  color: #315ca8;
  font-size: 11px;
  font-weight: 800;
  letter-spacing: .04em;
  text-transform: uppercase;
}

.motor-form {
  display: grid;
  grid-template-columns: minmax(0, 1.3fr) minmax(180px, .7fr) auto;
  gap: 12px;
  align-items: end;
  margin-bottom: 22px;
  padding: 16px;
  border-radius: 14px;
  background: #f7f8fa;
}

.field-group {
  display: flex;
  flex-direction: column;
  gap: 7px;
  min-width: 0;
}

.field-group > span {
  color: #455066;
  font-size: 13px;
  font-weight: 750;
}

.field-group input,
.field-group textarea {
  width: 100%;
  box-sizing: border-box;
  border: 1px solid #d8dde6;
  border-radius: 10px;
  background: #fff;
  color: #182033;
  outline: none;
}

.field-group input {
  min-height: 46px;
  padding: 0 12px;
}

.field-group textarea {
  padding: 12px;
  line-height: 1.5;
  resize: vertical;
}

.field-group input:focus,
.field-group textarea:focus {
  border-color: #4775c5;
  box-shadow: 0 0 0 3px rgba(71, 117, 197, .11);
}

.field-group small {
  color: #8a93a3;
  font-size: 11px;
  line-height: 1.45;
}

.money-input {
  display: flex;
  align-items: center;
  min-height: 46px;
  overflow: hidden;
  border: 1px solid #d8dde6;
  border-radius: 10px;
  background: #fff;
}

.money-input > span {
  align-self: stretch;
  display: flex;
  align-items: center;
  padding: 0 11px;
  background: #eef1f5;
  color: #677184;
  font-weight: 750;
}

.money-input input { border: 0; border-radius: 0; box-shadow: none !important; }

.primary-btn,
.secondary-btn,
.danger-btn {
  min-height: 44px;
  padding: 0 15px;
  border-radius: 10px;
  font-weight: 800;
}

.primary-btn { background: #172033; color: #fff; }
.primary-btn:hover:not(:disabled) { background: #263550; }
.secondary-btn { border: 1px solid #d8dde6; background: #fff; color: #344054; }
.danger-btn { border: 1px solid #f0caca; background: #fff6f6; color: #b52b2b; }
.danger-btn:hover:not(:disabled) { background: #feecec; }

.add-motor-btn { min-height: 46px; white-space: nowrap; }
.add-rfid-btn { flex: 0 0 auto; white-space: nowrap; }

.motor-list { display: grid; gap: 9px; }
.motor-item {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto;
  align-items: center;
  gap: 12px;
  min-height: 68px;
  padding: 10px 12px;
  border: 1px solid #e5e9ef;
  border-radius: 12px;
}

.motor-icon {
  display: grid;
  place-items: center;
  width: 42px;
  height: 42px;
  border-radius: 10px;
  background: #f2f4f7;
}

.motor-info { display: flex; flex-direction: column; gap: 3px; min-width: 0; }
.motor-info strong { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.motor-info span { color: #677184; font-size: 13px; }

.danger-text-btn {
  padding: 8px 9px;
  border-radius: 8px;
  background: #fff2f2;
  color: #bb2b2b;
  font-weight: 750;
}

.rfid-note {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  margin: -4px 0 18px;
  padding: 12px 14px;
  border: 1px solid #dbe6f8;
  border-radius: 12px;
  background: #f5f8fe;
  color: #50627d;
}

.rfid-note p { margin: 0; font-size: 13px; line-height: 1.5; }
.note-icon {
  flex: 0 0 auto;
  display: grid;
  place-items: center;
  width: 22px;
  height: 22px;
  border-radius: 50%;
  background: #315ca8;
  color: #fff;
  font-size: 12px;
  font-weight: 900;
}

.rfid-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(210px, 1fr));
  gap: 12px;
}

.rfid-card {
  min-width: 0;
  padding: 15px;
  border: 1px solid #e0e5ec;
  border-radius: 14px;
  background: linear-gradient(180deg, #fff 0%, #fbfcfd 100%);
}

.rfid-card.is-used { border-color: #d9c78d; background: #fffdf5; }
.rfid-card-top { align-items: center; justify-content: space-between; gap: 8px; margin-bottom: 16px; }
.token-number {
  display: grid;
  place-items: center;
  width: 42px;
  height: 42px;
  border-radius: 11px;
  background: #172033;
  color: #fff;
  font-size: 18px;
  font-weight: 900;
  letter-spacing: .04em;
}

.mapping-state {
  padding: 5px 8px;
  border-radius: 999px;
  background: #ebf8ef;
  color: #20723a;
  font-size: 10px;
  font-weight: 850;
  text-transform: uppercase;
  letter-spacing: .04em;
}

.mapping-state.used { background: #fff1c9; color: #805d0d; }
.mapping-state.missing { background: #fff5dc; color: #8a6110; }

.uid-block { display: flex; flex-direction: column; gap: 5px; margin-bottom: 12px; }
.uid-block span {
  color: #818a99;
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: .06em;
}
.uid-block strong {
  min-height: 22px;
  overflow-wrap: anywhere;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-size: 14px;
}

.active-rfid-info {
  margin: 0 0 12px;
  padding: 8px 10px;
  border-radius: 9px;
  background: #fff5d9;
  color: #7b5b0e;
  font-size: 11px;
  font-weight: 750;
}

.rfid-actions { gap: 8px; }
.rfid-actions > button { flex: 1; min-width: 0; padding-left: 8px; padding-right: 8px; }

.system-form { max-width: 720px; }
.full-width { width: 100%; }
.form-actions { justify-content: flex-end; margin-top: 14px; }

.empty-state { text-align: center; color: #748094; }
.empty-state.compact {
  padding: 28px 16px;
  border: 1px dashed #d7dde6;
  border-radius: 13px;
  background: #fafbfc;
}
.empty-icon { margin-bottom: 8px; font-size: 27px; }
.empty-state strong { display: block; color: #455066; }
.empty-state p { max-width: 470px; margin: 5px auto 0; font-size: 13px; line-height: 1.5; }

.modal-backdrop {
  position: fixed;
  inset: 0;
  z-index: 1000;
  display: grid;
  place-items: center;
  padding: 16px;
  background: rgba(12, 18, 30, .56);
  backdrop-filter: blur(4px);
}

.modal-card {
  width: min(100%, 480px);
  max-height: calc(100vh - 32px);
  overflow-y: auto;
  padding: 20px;
  border-radius: 18px;
  background: #fff;
  box-shadow: 0 24px 70px rgba(0, 0, 0, .24);
}

.modal-header { align-items: flex-start; justify-content: space-between; gap: 12px; margin-bottom: 18px; }
.modal-header h3 { margin: 0; font-size: 22px; }
.modal-close {
  display: grid;
  place-items: center;
  width: 36px;
  height: 36px;
  border-radius: 9px;
  background: #f1f3f6;
  color: #586273;
  font-size: 25px;
  line-height: 1;
}

.add-rfid-form { display: grid; gap: 15px; }
.current-uid {
  display: flex;
  flex-direction: column;
  gap: 4px;
  margin-bottom: 15px;
  padding: 12px;
  border-radius: 11px;
  background: #f5f7fa;
}
.current-uid span { color: #808999; font-size: 11px; font-weight: 750; text-transform: uppercase; }
.current-uid strong { font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; }

.modal-warning {
  margin-bottom: 14px;
  padding: 10px 12px;
  border: 1px solid #ead9a2;
  border-radius: 9px;
  background: #fff9e8;
  color: #73570d;
  font-size: 12px;
  line-height: 1.5;
}

.modal-error {
  margin-top: 12px;
  padding: 10px 12px;
  border-radius: 9px;
  background: #fff1f1;
  color: #ac2929;
  font-size: 12px;
  font-weight: 650;
}

.modal-actions { justify-content: flex-end; gap: 9px; margin-top: 20px; }

.toast {
  position: fixed;
  right: 18px;
  bottom: 18px;
  z-index: 1200;
  display: flex;
  align-items: center;
  gap: 10px;
  max-width: min(390px, calc(100vw - 36px));
  padding: 12px 15px;
  border-radius: 12px;
  color: #fff;
  box-shadow: 0 15px 36px rgba(0, 0, 0, .18);
}
.toast.success { background: #1e7b45; }
.toast.error { background: #aa3030; }
.toast > span {
  display: grid;
  place-items: center;
  width: 22px;
  height: 22px;
  border-radius: 50%;
  background: rgba(255,255,255,.18);
  font-weight: 900;
}
.toast p { margin: 0; font-size: 13px; font-weight: 700; }
.toast-enter-active, .toast-leave-active { transition: .2s ease; }
.toast-enter-from, .toast-leave-to { opacity: 0; transform: translateY(8px); }

@media (max-width: 760px) {
  .page-header { align-items: center; }
  .subtitle { font-size: 13px; }
  .refresh-btn { width: 42px; min-width: 42px; padding: 0; justify-content: center; }
  .refresh-text { display: none; }
  .settings-panel { border-radius: 15px; }
  .motor-form { grid-template-columns: 1fr; }
  .add-motor-btn { width: 100%; }
  .rfid-heading { flex-direction: column; }
  .add-rfid-btn { width: 100%; }
  .rfid-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
}

@media (max-width: 480px) {
  .settings-page { padding-bottom: 18px; }
  .page-header { gap: 10px; margin-bottom: 13px; }
  .page-header h1 { font-size: 23px; }
  .subtitle { display: none; }

  .settings-tabs {
    position: sticky;
    top: 0;
    z-index: 10;
    margin-left: -2px;
    margin-right: -2px;
  }

  .tab-btn {
    flex-direction: column;
    gap: 2px;
    min-height: 49px;
    padding: 5px 4px;
    font-size: 11px;
  }

  .tab-icon { font-size: 16px; }
  .settings-panel { padding: 16px; }
  .panel-heading { margin-bottom: 17px; }
  .panel-heading h2 { font-size: 20px; }
  .panel-heading p { font-size: 12px; }
  .motor-form { margin-left: -2px; margin-right: -2px; padding: 12px; }

  .motor-item { grid-template-columns: 38px minmax(0, 1fr) auto; gap: 9px; padding: 9px; }
  .motor-icon { width: 38px; height: 38px; }
  .motor-info strong { font-size: 13px; }
  .danger-text-btn { font-size: 11px; }

  .rfid-grid { gap: 9px; }
  .rfid-card { padding: 11px; }
  .rfid-card-top { margin-bottom: 13px; }
  .token-number { width: 37px; height: 37px; font-size: 16px; }
  .mapping-state { padding: 4px 6px; font-size: 8px; }
  .uid-block strong { font-size: 11px; }
  .active-rfid-info { font-size: 10px; }

  .rfid-actions { flex-direction: column; }
  .rfid-actions > button { width: 100%; min-height: 38px; font-size: 11px; }

  .form-actions { display: grid; grid-template-columns: 1fr; }
  .form-actions .primary-btn { width: 100%; }
  .modal-actions { display: grid; grid-template-columns: 1fr 1fr; }

  .toast { right: 10px; bottom: 10px; max-width: calc(100vw - 20px); }
}
</style>
