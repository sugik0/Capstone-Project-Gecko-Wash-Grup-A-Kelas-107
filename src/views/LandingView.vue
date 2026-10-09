<template>
  <main class="landing">
    <!-- Header khusus pelanggan: tidak menampilkan akses admin/operator. -->
    <header class="site-header">
      <div class="header-inner">
        <RouterLink to="/" class="brand" aria-label="Gecko Wash - Beranda">
          <span class="brand-mark" aria-hidden="true">G</span>
          <span class="brand-copy">
            <strong>GECKO WASH</strong>
            <small>TOUCHLESS</small>
          </span>
        </RouterLink>

        <a class="header-cta" href="#cek-status">
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M10.8 18.2a7.4 7.4 0 1 1 5.23-2.17L21 21" />
          </svg>
          <span>Cek Status</span>
        </a>
      </div>
    </header>

    <!-- Hero -->
    <section class="hero" aria-labelledby="hero-title">
      <div class="hero-inner">
        <div class="hero-copy">
          <div class="hero-badge">
            <span class="badge-dot" aria-hidden="true"></span>
            Cuci Motor Touchless · Denpasar
          </div>

          <h1 id="hero-title">
            Motor bersih.<br />
            <span>Progres tetap jelas.</span>
          </h1>

          <p class="hero-description">
            Pantau tahapan pencucian motor Anda dengan mudah. Cukup masukkan
            nomor polisi untuk melihat status kendaraan tanpa perlu berulang kali
            menanyakan progres kepada operator.
          </p>

          <div class="hero-actions">
            <a class="btn btn-primary" href="#cek-status">
              Cek Status Kendaraan
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="m9 18 6-6-6-6" />
              </svg>
            </a>
            <a class="btn btn-secondary" href="#cara-memantau">Cara Memantau</a>
          </div>

          <div class="hero-points" aria-label="Keunggulan layanan pelanggan">
            <div class="hero-point">
              <span class="point-icon" aria-hidden="true">
                <svg viewBox="0 0 24 24"><path d="M20 6 9 17l-5-5" /></svg>
              </span>
              <span>Status mudah dipahami</span>
            </div>
            <div class="hero-point">
              <span class="point-icon" aria-hidden="true">
                <svg viewBox="0 0 24 24"><path d="M12 8v4l2.7 1.6" /><circle cx="12" cy="12" r="9" /></svg>
              </span>
              <span>Pembaruan berkala</span>
            </div>
          </div>
        </div>

        <div class="hero-visual" aria-hidden="true">
          <div class="visual-orb visual-orb-one"></div>
          <div class="visual-orb visual-orb-two"></div>
          <div class="image-card">
            <div class="image-accent"></div>
            <img
              src="../asset/GambarHeroGecko.png"
              alt=""
              class="hero-image"
            />
            <div class="floating-card floating-card-top">
              <span class="floating-icon">
                <svg viewBox="0 0 24 24"><path d="M20 6 9 17l-5-5" /></svg>
              </span>
              <span>
                <small>PROGRES</small>
                <strong>Mudah dipantau</strong>
              </span>
            </div>
            <div class="floating-card floating-card-bottom">
              <span class="floating-status-dot"></span>
              <span>
                <small>STATUS LAYANAN</small>
                <strong>Diperbarui berkala</strong>
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Cek Status -->
    <section id="cek-status" class="status-section" aria-labelledby="status-title">
      <div class="section-shell">
        <div class="section-heading">
          <span class="section-kicker">CEK PROGRES</span>
          <h2 id="status-title">Kendaraan Anda sedang di tahap mana?</h2>
          <p>
            Masukkan nomor polisi yang didaftarkan operator untuk melihat status
            pelayanan kendaraan Anda.
          </p>
        </div>

        <div class="lookup-panel">
          <form class="lookup-form" @submit.prevent="cekKendaraan" novalidate>
            <label for="plat-number">Nomor polisi kendaraan</label>
            <div class="lookup-row">
              <div class="input-wrap" :class="{ 'has-error': pesanError }">
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <rect x="3" y="6" width="18" height="12" rx="3" />
                  <path d="M7 10h10M7 14h6" />
                </svg>
                <input
                  id="plat-number"
                  :value="inputPlat"
                  type="text"
                  inputmode="text"
                  autocomplete="off"
                  autocapitalize="characters"
                  spellcheck="false"
                  maxlength="16"
                  placeholder="Contoh: DK 1234 KJS"
                  aria-describedby="plat-help"
                  @input="onPlateInput"
                />
              </div>

              <button class="search-button" type="submit" :disabled="loading">
                <span v-if="loading" class="spinner" aria-hidden="true"></span>
                <svg v-else viewBox="0 0 24 24" aria-hidden="true">
                  <circle cx="11" cy="11" r="7" />
                  <path d="m20 20-4-4" />
                </svg>
                {{ loading ? 'Mencari...' : 'Cek Status' }}
              </button>
            </div>
            <p id="plat-help" class="field-help">
              Gunakan nomor polisi yang sama seperti saat kendaraan didaftarkan.
            </p>
          </form>

          <transition name="message">
            <div v-if="pesanError" class="feedback feedback-error" role="alert">
              <span class="feedback-icon" aria-hidden="true">!</span>
              <span>{{ pesanError }}</span>
            </div>
          </transition>

          <transition name="result">
            <article v-if="hasilPencarian" class="result-card" aria-live="polite">
              <div class="result-header">
                <div>
                  <span class="result-overline">KENDARAAN ANDA</span>
                  <h3>{{ hasilPencarian.plat_number }}</h3>
                  <p>{{ statusDescription }}</p>
                </div>
                <span class="status-pill" :class="statusClass">
                  <span class="status-indicator" aria-hidden="true"></span>
                  {{ getStatusText(hasilPencarian.status) }}
                </span>
              </div>

              <div class="vehicle-summary">
                <div class="summary-item">
                  <span class="summary-label">Kartu antrean</span>
                  <strong>#{{ hasilPencarian.token_number || '-' }}</strong>
                </div>
                <div v-if="hasilPencarian.motor_type" class="summary-item">
                  <span class="summary-label">Jenis kendaraan</span>
                  <strong>{{ hasilPencarian.motor_type }}</strong>
                </div>
                <div class="summary-item">
                  <span class="summary-label">Status saat ini</span>
                  <strong>{{ getStatusText(hasilPencarian.status) }}</strong>
                </div>
              </div>

              <div class="progress-wrap">
                <div class="progress-title-row">
                  <div>
                    <h4>Progres pengerjaan</h4>
                    <small class="progress-subtitle">Tahapan pencucian kendaraan</small>
                  </div>
                  <span>{{ progressPercent }}%</span>
                </div>

                <div class="desktop-progress" aria-label="Tahapan progres kendaraan">
                  <div
                    v-for="(step, index) in steps"
                    :key="step.key"
                    class="progress-step"
                    :class="{
                      reached: index <= currentStep,
                      current: index === currentStep
                    }"
                  >
                    <div class="step-marker">
                      <svg v-if="index < currentStep || (isServiceComplete && index === currentStep)" viewBox="0 0 24 24" aria-hidden="true">
                        <path d="M20 6 9 17l-5-5" />
                      </svg>
                      <span v-else>{{ index + 1 }}</span>
                    </div>
                    <div class="step-copy">
                      <strong>{{ step.label }}</strong>
                      <small>{{ step.short }}</small>
                    </div>
                  </div>
                </div>

                <div class="mobile-progress" aria-label="Tahapan progres kendaraan">
                  <div
                    v-for="(step, index) in steps"
                    :key="`mobile-${step.key}`"
                    class="mobile-step"
                    :class="{
                      reached: index <= currentStep,
                      current: index === currentStep
                    }"
                  >
                    <div class="mobile-step-line">
                      <div class="step-marker">
                        <svg v-if="index < currentStep || (isServiceComplete && index === currentStep)" viewBox="0 0 24 24" aria-hidden="true">
                          <path d="M20 6 9 17l-5-5" />
                        </svg>
                        <span v-else>{{ index + 1 }}</span>
                      </div>
                    </div>
                    <div class="step-copy">
                      <strong>{{ step.label }}</strong>
                      <small>{{ step.short }}</small>
                    </div>
                  </div>
                </div>
              </div>

              <div class="result-note">
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <circle cx="12" cy="12" r="9" />
                  <path d="M12 11v5M12 8h.01" />
                </svg>
                <p>
                  Progres menunjukkan tahapan pengerjaan kendaraan. Status FINISH berarti
                  motor sudah selesai dicuci dan siap diambil, sedangkan SELESAI berarti
                  proses pelayanan/transaksi telah ditutup oleh operator.
                </p>
              </div>
            </article>
          </transition>
        </div>
      </div>
    </section>

    <!-- Cara memantau -->
    <section id="cara-memantau" class="how-section" aria-labelledby="how-title">
      <div class="section-shell">
        <div class="how-layout">
          <div class="section-heading how-heading">
            <span class="section-kicker">MUDAH DIGUNAKAN</span>
            <h2 id="how-title">Cek progres hanya dalam 3 langkah.</h2>
            <p>
              Halaman ini dibuat khusus untuk pelanggan. Anda tidak perlu masuk ke
              halaman operator atau mengakses menu administrasi.
            </p>
          </div>

          <div class="how-grid">
            <article class="how-card">
              <span class="how-number">01</span>
              <div class="how-icon">
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M4 5h16v14H4zM8 9h8M8 13h5" />
                </svg>
              </div>
              <h3>Daftarkan kendaraan</h3>
              <p>Operator mendaftarkan nomor polisi dan memberikan kartu antrean RFID.</p>
            </article>

            <article class="how-card featured">
              <span class="how-number">02</span>
              <div class="how-icon">
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <circle cx="11" cy="11" r="7" />
                  <path d="m20 20-4-4" />
                </svg>
              </div>
              <h3>Masukkan nomor polisi</h3>
              <p>Ketik nomor polisi kendaraan pada kolom cek status di halaman ini.</p>
            </article>

            <article class="how-card">
              <span class="how-number">03</span>
              <div class="how-icon">
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M5 12.5 9 16l10-10" />
                  <circle cx="12" cy="12" r="9" />
                </svg>
              </div>
              <h3>Lihat progres</h3>
              <p>Pantau status kendaraan dari antre hingga pelayanan dinyatakan selesai.</p>
            </article>
          </div>
        </div>
      </div>
    </section>

    <!-- Footer sederhana khusus publik -->
    <footer class="site-footer">
      <div class="footer-inner">
        <div class="footer-brand">
          <span class="brand-mark footer-mark" aria-hidden="true">G</span>
          <div>
            <strong>GECKO WASH</strong>
            <span>Touchless Motor Wash</span>
          </div>
        </div>

        <div class="footer-location">
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z" />
            <circle cx="12" cy="10" r="2.5" />
          </svg>
          <span>Denpasar, Bali</span>
        </div>

        <p class="copyright">© 2026 Gecko Wash. All rights reserved.</p>
      </div>
    </footer>
  </main>
</template>

<script setup>
import { computed, ref } from 'vue'
import { RouterLink } from 'vue-router'
import api from '../services/api'

const inputPlat = ref('')
const hasilPencarian = ref(null)
const pesanError = ref('')
const loading = ref(false)

const steps = [
  { key: 'ANTRI', label: 'Antre', short: 'Menunggu giliran' },
  { key: 'PROSES CUCI', label: 'Proses Cuci', short: 'Sedang dicuci' },
  { key: 'PENGERINGAN', label: 'Pengeringan', short: 'Sedang dikeringkan' },
  { key: 'FINISH', label: 'Siap Diambil', short: 'Pengerjaan selesai' }
]

// Progress di halaman pelanggan merepresentasikan progres pengerjaan kendaraan.
// Status SELESAI adalah status administrasi/transaksi setelah kendaraan FINISH,
// sehingga FINISH dan SELESAI sama-sama ditampilkan sebagai progres 100%.
const currentStep = computed(() => {
  const status = hasilPencarian.value?.status

  if (status === 'SELESAI') return steps.length - 1

  const index = steps.findIndex((step) => step.key === status)
  return index >= 0 ? index : 0
})

const progressPercent = computed(() => {
  if (!hasilPencarian.value) return 0

  const status = hasilPencarian.value.status
  if (status === 'FINISH' || status === 'SELESAI') return 100

  return Math.round(((currentStep.value + 1) / steps.length) * 100)
})

const isServiceComplete = computed(() =>
  ['FINISH', 'SELESAI'].includes(hasilPencarian.value?.status)
)

const statusClass = computed(() => {
  const status = hasilPencarian.value?.status
  return {
    ANTRI: 'status-queue',
    'PROSES CUCI': 'status-wash',
    PENGERINGAN: 'status-dry',
    FINISH: 'status-finish',
    SELESAI: 'status-done'
  }[status] || 'status-default'
})

const statusDescription = computed(() => {
  const status = hasilPencarian.value?.status
  return {
    ANTRI: 'Kendaraan Anda sudah terdaftar dan sedang menunggu giliran pelayanan.',
    'PROSES CUCI': 'Kendaraan Anda sedang berada pada tahap pencucian.',
    PENGERINGAN: 'Pencucian selesai dan kendaraan sedang berada pada tahap pengeringan.',
    FINISH: 'Pencucian kendaraan telah selesai. Motor Anda sudah siap untuk diambil.',
    SELESAI: 'Pengerjaan kendaraan dan proses transaksi telah selesai.'
  }[status] || 'Status kendaraan berhasil ditemukan.'
})

const onPlateInput = (event) => {
  inputPlat.value = event.target.value
    .toUpperCase()
    .replace(/[^A-Z0-9\s]/g, '')
    .replace(/\s+/g, ' ')
    .slice(0, 16)

  hasilPencarian.value = null
  pesanError.value = ''
}

const cekKendaraan = async () => {
  const plat = inputPlat.value.trim().toUpperCase()

  if (!plat) {
    pesanError.value = 'Masukkan nomor polisi kendaraan terlebih dahulu.'
    return
  }

  hasilPencarian.value = null
  pesanError.value = ''
  loading.value = true

  try {
    const response = await api.checkStatus(plat)

    if (response.data?.status === 'success' && response.data?.data) {
      hasilPencarian.value = response.data.data
    } else {
      pesanError.value = response.data?.message || 'Kendaraan belum ditemukan.'
    }
  } catch {
    pesanError.value = 'Gagal menghubungi server. Silakan coba beberapa saat lagi.'
  } finally {
    loading.value = false
  }
}

const getStatusText = (status) => ({
  ANTRI: 'Dalam antrean',
  'PROSES CUCI': 'Sedang dicuci',
  PENGERINGAN: 'Pengeringan',
  FINISH: 'Siap diambil',
  SELESAI: 'Pelayanan selesai'
}[status] || status || 'Status tidak diketahui')
</script>

<style scoped>
.landing {
  --navy: #10233f;
  --blue: #245fc2;
  --blue-dark: #184a9c;
  --blue-soft: #edf4ff;
  --yellow: #ffd83d;
  --yellow-soft: #fff8d9;
  --ink: #152033;
  --muted: #69758a;
  --line: #e5eaf2;
  --surface: #ffffff;
  --surface-soft: #f6f8fc;
  --success: #1f8f61;
  --shadow: 0 24px 60px rgba(31, 52, 90, 0.12);
  --shadow-soft: 0 12px 34px rgba(31, 52, 90, 0.08);

  min-height: 100vh;
  overflow-x: hidden;
  color: var(--ink);
  background: var(--surface);
}

.landing svg {
  fill: none;
  stroke: currentColor;
  stroke-width: 1.9;
  stroke-linecap: round;
  stroke-linejoin: round;
}

.site-header {
  position: sticky;
  top: 0;
  z-index: 50;
  border-bottom: 1px solid rgba(222, 229, 239, 0.78);
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(18px);
  -webkit-backdrop-filter: blur(18px);
}

.header-inner {
  width: min(1180px, calc(100% - 40px));
  min-height: 78px;
  margin: 0 auto;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 24px;
}

.brand {
  display: inline-flex;
  align-items: center;
  gap: 11px;
  min-width: 0;
  color: var(--navy);
  text-decoration: none;
}

.brand-mark {
  width: 42px;
  height: 42px;
  flex: 0 0 42px;
  display: grid;
  place-items: center;
  border-radius: 14px;
  background: linear-gradient(145deg, var(--navy), #244a79);
  box-shadow: 0 8px 20px rgba(16, 35, 63, 0.2);
  color: #fff;
  font-size: 22px;
  font-weight: 800;
}

.brand-copy {
  display: grid;
  gap: 1px;
}

.brand-copy strong {
  font-size: 17px;
  letter-spacing: -0.3px;
}

.brand-copy small {
  color: var(--muted);
  font-size: 9px;
  font-weight: 800;
  letter-spacing: 2.2px;
}

.header-cta {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 9px;
  min-height: 44px;
  padding: 0 18px;
  border-radius: 999px;
  background: var(--navy);
  color: #fff;
  text-decoration: none;
  font-size: 14px;
  font-weight: 700;
  transition: transform 0.2s ease, box-shadow 0.2s ease, background 0.2s ease;
}

.header-cta svg {
  width: 18px;
  height: 18px;
}

.header-cta:hover {
  transform: translateY(-1px);
  background: #1a385f;
  box-shadow: 0 8px 20px rgba(16, 35, 63, 0.16);
}

.hero {
  position: relative;
  isolation: isolate;
  background:
    radial-gradient(circle at 8% 20%, rgba(255, 216, 61, 0.2), transparent 25%),
    radial-gradient(circle at 90% 34%, rgba(36, 95, 194, 0.1), transparent 30%),
    linear-gradient(180deg, #fff 0%, #fbfcff 100%);
}

.hero-inner {
  width: min(1180px, calc(100% - 40px));
  min-height: 620px;
  margin: 0 auto;
  padding: 72px 0 78px;
  display: grid;
  grid-template-columns: minmax(0, 1.02fr) minmax(400px, 0.98fr);
  align-items: center;
  gap: clamp(36px, 6vw, 82px);
}

.hero-copy {
  position: relative;
  z-index: 2;
  max-width: 650px;
}

.hero-badge {
  width: fit-content;
  display: inline-flex;
  align-items: center;
  gap: 9px;
  padding: 8px 13px;
  border: 1px solid #dce8fa;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.78);
  color: var(--blue-dark);
  font-size: 12px;
  font-weight: 800;
  letter-spacing: 0.45px;
  box-shadow: 0 7px 18px rgba(31, 52, 90, 0.05);
}

.badge-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #21aa72;
  box-shadow: 0 0 0 5px rgba(33, 170, 114, 0.11);
}

.hero h1 {
  margin: 22px 0 22px;
  color: var(--navy);
  font-size: clamp(48px, 6vw, 76px);
  line-height: 0.98;
  letter-spacing: -3.8px;
}

.hero h1 span {
  position: relative;
  color: var(--blue);
}

.hero-description {
  max-width: 625px;
  margin: 0;
  color: var(--muted);
  font-size: clamp(16px, 1.8vw, 19px);
  line-height: 1.72;
}

.hero-actions {
  margin-top: 30px;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 12px;
}

.btn {
  min-height: 52px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 9px;
  padding: 0 22px;
  border-radius: 16px;
  text-decoration: none;
  font-size: 15px;
  font-weight: 800;
  transition: transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease;
}

.btn svg {
  width: 18px;
  height: 18px;
}

.btn-primary {
  background: var(--blue);
  box-shadow: 0 12px 28px rgba(36, 95, 194, 0.24);
  color: #fff;
}

.btn-primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 16px 32px rgba(36, 95, 194, 0.3);
}

.btn-secondary {
  border: 1px solid var(--line);
  background: rgba(255, 255, 255, 0.82);
  color: var(--navy);
}

.btn-secondary:hover {
  transform: translateY(-2px);
  border-color: #cad6e8;
  box-shadow: var(--shadow-soft);
}

.hero-points {
  margin-top: 30px;
  display: flex;
  flex-wrap: wrap;
  gap: 18px 26px;
  color: #536177;
  font-size: 13px;
  font-weight: 700;
}

.hero-point {
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

.point-icon {
  width: 26px;
  height: 26px;
  display: grid;
  place-items: center;
  border-radius: 8px;
  background: var(--blue-soft);
  color: var(--blue);
}

.point-icon svg {
  width: 15px;
  height: 15px;
}

.hero-visual {
  position: relative;
  min-height: 470px;
  display: grid;
  place-items: center;
}

.visual-orb {
  position: absolute;
  border-radius: 50%;
  filter: blur(2px);
  opacity: 0.9;
}

.visual-orb-one {
  width: 330px;
  height: 330px;
  right: 5%;
  top: 14%;
  background: rgba(255, 216, 61, 0.23);
}

.visual-orb-two {
  width: 230px;
  height: 230px;
  left: 5%;
  bottom: 0;
  background: rgba(55, 126, 230, 0.1);
}

.image-card {
  position: relative;
  width: min(100%, 510px);
  min-height: 470px;
  display: grid;
  place-items: center;
  border: 1px solid rgba(224, 231, 240, 0.9);
  border-radius: 38px;
  background: linear-gradient(145deg, rgba(255, 255, 255, 0.95), rgba(245, 248, 253, 0.92));
  box-shadow: var(--shadow);
}

.image-accent {
  position: absolute;
  width: 70%;
  aspect-ratio: 1;
  border-radius: 50%;
  background: linear-gradient(145deg, rgba(255, 216, 61, 0.42), rgba(255, 216, 61, 0.08));
}

.hero-image {
  position: relative;
  z-index: 2;
  width: 96%;
  max-height: 425px;
  object-fit: contain;
  filter: drop-shadow(0 18px 16px rgba(42, 58, 82, 0.12));
}

.floating-card {
  position: absolute;
  z-index: 4;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 11px 14px;
  border: 1px solid rgba(224, 230, 238, 0.9);
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.94);
  box-shadow: 0 16px 32px rgba(31, 52, 90, 0.14);
  backdrop-filter: blur(12px);
}

.floating-card small,
.floating-card strong {
  display: block;
}

.floating-card small {
  margin-bottom: 1px;
  color: #8993a3;
  font-size: 9px;
  font-weight: 800;
  letter-spacing: 0.8px;
}

.floating-card strong {
  color: var(--navy);
  font-size: 12px;
}

.floating-card-top {
  top: 34px;
  left: -28px;
}

.floating-card-bottom {
  right: -22px;
  bottom: 45px;
}

.floating-icon {
  width: 34px;
  height: 34px;
  display: grid;
  place-items: center;
  border-radius: 11px;
  background: #e9f7f1;
  color: var(--success);
}

.floating-icon svg {
  width: 18px;
  height: 18px;
}

.floating-status-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: #20aa72;
  box-shadow: 0 0 0 6px rgba(32, 170, 114, 0.1);
}

.status-section {
  scroll-margin-top: 94px;
  padding: 84px 0 92px;
  background: var(--surface-soft);
}

.section-shell {
  width: min(1080px, calc(100% - 40px));
  margin: 0 auto;
}

.section-heading {
  max-width: 720px;
  margin: 0 auto 32px;
  text-align: center;
}

.section-kicker,
.result-overline {
  display: inline-block;
  color: var(--blue);
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 1.7px;
}

.section-heading h2 {
  margin: 10px 0 12px;
  color: var(--navy);
  font-size: clamp(30px, 4.2vw, 46px);
  line-height: 1.1;
  letter-spacing: -1.7px;
}

.section-heading p {
  margin: 0;
  color: var(--muted);
  font-size: 16px;
  line-height: 1.65;
}

.lookup-panel {
  padding: 28px;
  border: 1px solid var(--line);
  border-radius: 28px;
  background: var(--surface);
  box-shadow: var(--shadow-soft);
}

.lookup-form label {
  display: block;
  margin-bottom: 9px;
  color: var(--navy);
  font-size: 14px;
  font-weight: 800;
}

.lookup-row {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 12px;
}

.input-wrap {
  min-width: 0;
  height: 56px;
  display: flex;
  align-items: center;
  gap: 11px;
  padding: 0 16px;
  border: 1px solid #d8e0ec;
  border-radius: 16px;
  background: #fbfcfe;
  transition: border-color 0.2s ease, box-shadow 0.2s ease, background 0.2s ease;
}

.input-wrap:focus-within {
  border-color: #7ca6e8;
  background: #fff;
  box-shadow: 0 0 0 4px rgba(36, 95, 194, 0.09);
}

.input-wrap.has-error {
  border-color: #dfa0a0;
}

.input-wrap svg {
  width: 22px;
  height: 22px;
  flex: 0 0 22px;
  color: #8290a4;
}

.input-wrap input {
  width: 100%;
  min-width: 0;
  border: 0;
  outline: 0;
  background: transparent;
  color: var(--navy);
  font-size: 17px;
  font-weight: 800;
  letter-spacing: 0.35px;
  text-transform: uppercase;
}

.input-wrap input::placeholder {
  color: #a3acba;
  font-weight: 600;
  letter-spacing: 0;
  text-transform: none;
}

.search-button {
  min-width: 170px;
  height: 56px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 9px;
  padding: 0 22px;
  border: 0;
  border-radius: 16px;
  background: var(--blue);
  box-shadow: 0 10px 22px rgba(36, 95, 194, 0.2);
  color: #fff;
  cursor: pointer;
  font-size: 15px;
  font-weight: 800;
  transition: transform 0.2s ease, box-shadow 0.2s ease, opacity 0.2s ease;
}

.search-button svg {
  width: 19px;
  height: 19px;
}

.search-button:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 13px 28px rgba(36, 95, 194, 0.26);
}

.search-button:disabled {
  cursor: wait;
  opacity: 0.72;
}

.spinner {
  width: 18px;
  height: 18px;
  border: 2px solid rgba(255, 255, 255, 0.38);
  border-top-color: #fff;
  border-radius: 50%;
  animation: spin 0.72s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.field-help {
  margin: 9px 0 0;
  color: #8a95a5;
  font-size: 12px;
}

.feedback {
  margin-top: 16px;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 13px 15px;
  border-radius: 14px;
  font-size: 14px;
  font-weight: 650;
}

.feedback-error {
  border: 1px solid #f1cece;
  background: #fff5f5;
  color: #a04444;
}

.feedback-icon {
  width: 24px;
  height: 24px;
  flex: 0 0 24px;
  display: grid;
  place-items: center;
  border-radius: 50%;
  background: #f4dede;
  font-size: 13px;
  font-weight: 900;
}

.result-card {
  margin-top: 22px;
  overflow: hidden;
  border: 1px solid #dfe6f1;
  border-radius: 24px;
  background: linear-gradient(180deg, #fff 0%, #fbfcff 100%);
}

.result-header {
  padding: 25px 26px 22px;
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 22px;
  border-bottom: 1px solid #edf1f6;
}

.result-header h3 {
  margin: 5px 0 6px;
  color: var(--navy);
  font-size: clamp(28px, 4vw, 38px);
  letter-spacing: -1.2px;
}

.result-header p {
  max-width: 620px;
  margin: 0;
  color: var(--muted);
  font-size: 14px;
  line-height: 1.55;
}

.status-pill {
  flex: 0 0 auto;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 9px 13px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 800;
  white-space: nowrap;
}

.status-indicator {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: currentColor;
}

.status-queue { background: #fff5cf; color: #8b6b00; }
.status-wash { background: #eaf2ff; color: #245fc2; }
.status-dry { background: #eef8ff; color: #257ba5; }
.status-finish { background: #f0edff; color: #6650b8; }
.status-done { background: #e9f7f0; color: #1e875c; }
.status-default { background: #f0f2f5; color: #5f6876; }

.vehicle-summary {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 1px;
  background: #edf1f6;
}

.summary-item {
  min-height: 86px;
  padding: 18px 22px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 5px;
  background: #fff;
}

.summary-label {
  color: #8994a5;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.45px;
  text-transform: uppercase;
}

.summary-item strong {
  color: var(--navy);
  font-size: 16px;
}

.progress-wrap {
  padding: 26px;
}

.progress-title-row {
  margin-bottom: 22px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}

.progress-title-row h4 {
  margin: 0;
  color: var(--navy);
  font-size: 15px;
}


.progress-subtitle {
  display: block;
  margin-top: 3px;
  color: var(--muted);
  font-size: 12px;
  font-weight: 600;
}

.progress-title-row span {
  padding: 5px 9px;
  border-radius: 999px;
  background: var(--blue-soft);
  color: var(--blue);
  font-size: 11px;
  font-weight: 800;
}

.desktop-progress {
  position: relative;
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 0;
}

.desktop-progress::before {
  content: '';
  position: absolute;
  top: 17px;
  left: 10%;
  right: 10%;
  height: 3px;
  border-radius: 3px;
  background: #e4e9f1;
}

.progress-step {
  position: relative;
  z-index: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
}

.step-marker {
  width: 36px;
  height: 36px;
  display: grid;
  place-items: center;
  border: 4px solid #fff;
  border-radius: 50%;
  background: #e6ebf2;
  box-shadow: 0 0 0 1px #dce3ed;
  color: #788497;
  font-size: 12px;
  font-weight: 800;
  transition: background 0.2s ease, color 0.2s ease, transform 0.2s ease;
}

.step-marker svg {
  width: 17px;
  height: 17px;
  stroke-width: 2.4;
}

.progress-step.reached .step-marker,
.mobile-step.reached .step-marker {
  background: var(--blue);
  color: #fff;
  box-shadow: 0 0 0 1px rgba(36, 95, 194, 0.22);
}

.progress-step.current .step-marker,
.mobile-step.current .step-marker {
  transform: scale(1.08);
  box-shadow: 0 0 0 6px rgba(36, 95, 194, 0.09);
}

.step-copy {
  min-width: 0;
  margin-top: 10px;
  display: grid;
  gap: 2px;
}

.step-copy strong {
  color: #6d7889;
  font-size: 12px;
}

.step-copy small {
  color: #a0a8b5;
  font-size: 10px;
  line-height: 1.3;
}

.progress-step.reached .step-copy strong,
.mobile-step.reached .step-copy strong {
  color: var(--navy);
}

.mobile-progress {
  display: none;
}

.result-note {
  margin: 0 26px 26px;
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 13px 15px;
  border-radius: 14px;
  background: #f7f9fc;
  color: #667287;
}

.result-note svg {
  width: 18px;
  height: 18px;
  flex: 0 0 18px;
  margin-top: 1px;
  color: var(--blue);
}

.result-note p {
  margin: 0;
  font-size: 12px;
  line-height: 1.55;
}

.how-section {
  scroll-margin-top: 90px;
  padding: 94px 0 100px;
  background: #fff;
}

.how-layout {
  display: grid;
  grid-template-columns: 0.8fr 1.2fr;
  align-items: start;
  gap: 54px;
}

.how-heading {
  margin: 0;
  text-align: left;
}

.how-heading h2 {
  max-width: 430px;
}

.how-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 14px;
}

.how-card {
  position: relative;
  min-height: 260px;
  padding: 22px;
  overflow: hidden;
  border: 1px solid var(--line);
  border-radius: 22px;
  background: #fff;
  box-shadow: 0 8px 24px rgba(31, 52, 90, 0.04);
}

.how-card.featured {
  border-color: #d9e5f8;
  background: linear-gradient(180deg, #f8fbff 0%, #fff 100%);
  transform: translateY(-10px);
}

.how-number {
  position: absolute;
  top: 17px;
  right: 18px;
  color: #dce4ef;
  font-size: 26px;
  font-weight: 800;
}

.how-icon {
  width: 46px;
  height: 46px;
  display: grid;
  place-items: center;
  border-radius: 15px;
  background: var(--blue-soft);
  color: var(--blue);
}

.how-icon svg {
  width: 23px;
  height: 23px;
}

.how-card h3 {
  margin: 50px 0 9px;
  color: var(--navy);
  font-size: 17px;
  line-height: 1.25;
}

.how-card p {
  margin: 0;
  color: var(--muted);
  font-size: 13px;
  line-height: 1.6;
}

.site-footer {
  background: var(--navy);
  color: #fff;
}

.footer-inner {
  width: min(1180px, calc(100% - 40px));
  min-height: 126px;
  margin: 0 auto;
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  align-items: center;
  gap: 28px;
}

.footer-brand {
  display: flex;
  align-items: center;
  gap: 11px;
}

.footer-mark {
  background: #fff;
  box-shadow: none;
  color: var(--navy);
}

.footer-brand strong,
.footer-brand span {
  display: block;
}

.footer-brand strong {
  font-size: 15px;
}

.footer-brand span {
  margin-top: 2px;
  color: #9fb0c9;
  font-size: 11px;
}

.footer-location {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  color: #d5deeb;
  font-size: 13px;
  font-weight: 650;
}

.footer-location svg {
  width: 18px;
  height: 18px;
  color: var(--yellow);
}

.copyright {
  margin: 0;
  color: #9fb0c9;
  font-size: 12px;
  text-align: right;
}

.message-enter-active,
.message-leave-active,
.result-enter-active,
.result-leave-active {
  transition: opacity 0.22s ease, transform 0.22s ease;
}

.message-enter-from,
.message-leave-to,
.result-enter-from,
.result-leave-to {
  opacity: 0;
  transform: translateY(8px);
}

@media (max-width: 980px) {
  .hero-inner {
    grid-template-columns: 1fr 0.9fr;
    gap: 34px;
  }

  .hero h1 {
    letter-spacing: -3px;
  }

  .floating-card-top {
    left: -12px;
  }

  .floating-card-bottom {
    right: -10px;
  }

  .how-layout {
    grid-template-columns: 1fr;
    gap: 36px;
  }

  .how-heading {
    max-width: 680px;
    margin: 0 auto;
    text-align: center;
  }

  .how-heading h2 {
    max-width: none;
  }
}

@media (max-width: 800px) {
  .hero-inner {
    min-height: auto;
    padding: 54px 0 62px;
    grid-template-columns: 1fr;
    gap: 44px;
  }

  .hero-copy {
    max-width: 690px;
    margin: 0 auto;
    text-align: center;
  }

  .hero-badge {
    margin: 0 auto;
  }

  .hero-description {
    margin-left: auto;
    margin-right: auto;
  }

  .hero-actions,
  .hero-points {
    justify-content: center;
  }

  .hero-visual {
    width: min(580px, 92%);
    min-height: 430px;
    margin: 0 auto;
  }

  .image-card {
    min-height: 420px;
  }

  .footer-inner {
    min-height: 160px;
    grid-template-columns: 1fr 1fr;
  }

  .copyright {
    grid-column: 1 / -1;
    padding-bottom: 24px;
    text-align: left;
  }
}

@media (max-width: 680px) {
  .header-inner,
  .hero-inner,
  .section-shell,
  .footer-inner {
    width: min(100% - 28px, 1180px);
  }

  .header-inner {
    min-height: 68px;
  }

  .brand-mark {
    width: 38px;
    height: 38px;
    flex-basis: 38px;
    border-radius: 12px;
    font-size: 20px;
  }

  .brand-copy strong {
    font-size: 15px;
  }

  .brand-copy small {
    font-size: 8px;
    letter-spacing: 1.7px;
  }

  .header-cta {
    min-height: 40px;
    padding: 0 14px;
  }

  .hero-inner {
    padding: 42px 0 54px;
  }

  .hero h1 {
    margin-top: 18px;
    font-size: clamp(42px, 13vw, 58px);
    letter-spacing: -2.7px;
  }

  .hero-description {
    font-size: 16px;
    line-height: 1.65;
  }

  .hero-actions {
    display: grid;
    grid-template-columns: 1fr;
  }

  .btn {
    width: 100%;
  }

  .hero-points {
    gap: 12px 18px;
  }

  .hero-visual {
    width: 100%;
    min-height: 345px;
  }

  .image-card {
    width: 94%;
    min-height: 340px;
    border-radius: 28px;
  }

  .hero-image {
    max-height: 320px;
  }

  .floating-card {
    padding: 9px 11px;
    border-radius: 13px;
  }

  .floating-card-top {
    top: 22px;
    left: -2px;
  }

  .floating-card-bottom {
    right: -2px;
    bottom: 26px;
  }

  .floating-icon {
    width: 30px;
    height: 30px;
  }

  .floating-card strong {
    font-size: 10px;
  }

  .floating-card small {
    font-size: 8px;
  }

  .status-section {
    padding: 62px 0 68px;
  }

  .section-heading {
    margin-bottom: 24px;
  }

  .section-heading h2 {
    letter-spacing: -1.2px;
  }

  .lookup-panel {
    padding: 18px;
    border-radius: 22px;
  }

  .lookup-row {
    grid-template-columns: 1fr;
  }

  .search-button {
    width: 100%;
  }

  .result-header {
    padding: 21px 20px 18px;
    flex-direction: column;
  }

  .vehicle-summary {
    grid-template-columns: 1fr;
  }

  .summary-item {
    min-height: 68px;
    padding: 14px 20px;
  }

  .progress-wrap {
    padding: 22px 20px;
  }

  .desktop-progress {
    display: none;
  }

  .mobile-progress {
    display: grid;
  }

  .mobile-step {
    min-height: 63px;
    display: grid;
    grid-template-columns: 38px 1fr;
    gap: 12px;
  }

  .mobile-step-line {
    position: relative;
  }

  .mobile-step:not(:last-child) .mobile-step-line::after {
    content: '';
    position: absolute;
    top: 36px;
    bottom: -27px;
    left: 17px;
    width: 2px;
    background: #e2e8f0;
  }

  .mobile-step.reached:not(:last-child) .mobile-step-line::after {
    background: rgba(36, 95, 194, 0.35);
  }

  .mobile-step .step-copy {
    margin-top: 3px;
    text-align: left;
  }

  .mobile-step .step-copy strong {
    font-size: 13px;
  }

  .mobile-step .step-copy small {
    font-size: 11px;
  }

  .result-note {
    margin: 0 20px 20px;
  }

  .how-section {
    padding: 70px 0 76px;
  }

  .how-grid {
    grid-template-columns: 1fr;
  }

  .how-card,
  .how-card.featured {
    min-height: 0;
    transform: none;
  }

  .how-card h3 {
    margin-top: 32px;
  }

  .footer-inner {
    min-height: 0;
    padding: 34px 0 28px;
    grid-template-columns: 1fr;
    gap: 22px;
  }

  .footer-location {
    justify-content: flex-start;
  }

  .copyright {
    grid-column: auto;
    padding: 0;
  }
}

@media (max-width: 430px) {
  .brand-copy small {
    display: none;
  }

  .header-cta span {
    font-size: 13px;
  }

  .header-cta svg {
    display: none;
  }

  .hero-badge {
    font-size: 10px;
  }

  .hero h1 {
    font-size: clamp(38px, 12.5vw, 50px);
  }

  .hero-points {
    display: grid;
    grid-template-columns: 1fr;
    justify-items: center;
  }

  .hero-visual {
    min-height: 300px;
  }

  .image-card {
    min-height: 296px;
  }

  .hero-image {
    max-height: 276px;
  }

  .floating-card-top {
    top: 13px;
  }

  .floating-card-bottom {
    bottom: 16px;
  }

  .status-pill {
    white-space: normal;
  }
}

@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    scroll-behavior: auto !important;
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
</style>
