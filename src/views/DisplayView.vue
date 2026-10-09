<template>
  <div class="tv-display">
    <!-- PANEL MEDIA IKLAN -->
    <aside class="ad-panel" aria-label="Panel video iklan Gecko Wash">
      <video
        v-if="hasMedia"
        :key="currentMediaSrc"
        ref="videoRef"
        class="ad-video"
        :src="currentMediaSrc"
        autoplay
        playsinline
        preload="auto"
        @loadeddata="handleMediaReady"
        @canplay="attemptMediaPlayback"
        @ended="nextMedia"
        @error="handleMediaError"
      ></video>

      <div v-else class="ad-placeholder">
        <div class="ad-placeholder-logo">G</div>
        <strong>GECKO WASH TOUCHLESS</strong>
        <span>{{ mediaMessage }}</span>
      </div>

      <div v-if="hasMedia && mediaItems.length > 1" class="media-counter">
        {{ currentMediaIndex + 1 }} / {{ mediaItems.length }}
      </div>

      <!-- Browser desktop/Vite umumnya memblokir autoplay dengan suara.
           Jika terjadi, video tetap berjalan dalam keadaan mute dan tombol ini
           menjadi satu-satunya interaksi yang diperlukan untuk membuka audio. -->
      <button
        v-if="hasMedia && mediaPlaybackBlocked"
        type="button"
        class="audio-activate"
        @click="activateDisplayAudio"
      >
        <span class="audio-activate-icon">🔊</span>
        <span>
          <strong>Aktifkan Suara TV</strong>
          <small>Video iklan & pengumuman antrean</small>
        </span>
      </button>

      <div v-if="hasMedia" class="media-controls" aria-label="Kontrol volume video iklan">
        <button
          type="button"
          class="volume-btn"
          :aria-label="(isMediaMuted || mediaPlaybackBlocked) ? 'Aktifkan suara video' : 'Matikan suara video'"
          @click="toggleMediaMute"
        >
          {{ (isMediaMuted || mediaPlaybackBlocked) ? '🔇' : '🔊' }}
        </button>

        <button type="button" class="volume-btn compact" aria-label="Kurangi volume" @click="adjustMediaVolume(-0.1)">
          −
        </button>

        <input
          v-model.number="mediaVolume"
          class="volume-slider"
          type="range"
          min="0"
          max="1"
          step="0.05"
          aria-label="Volume video iklan"
          @input="applyMediaVolume"
        />

        <button type="button" class="volume-btn compact" aria-label="Tambah volume" @click="adjustMediaVolume(0.1)">
          +
        </button>

        <span class="volume-value">{{ mediaVolumePercent }}%</span>
      </div>
    </aside>

    <!-- DISPLAY ANTREAN -->
    <main class="queue-main">
      <header class="queue-header">
        <div class="brand-copy">
          <div class="wordmark">GECKO WASH TOUCHLESS</div>
          <p>Cuci Motor Cepat, Bersih, dan Tanpa Goresan!</p>
        </div>

        <div class="queue-clock">
          <h1>Antrean Cuci Motor</h1>
          <time>{{ currentTime }} WITA</time>
          <span class="current-date">{{ currentDate }}</span>
        </div>
      </header>

      <div v-if="!isOnline || totalPages > 1" class="queue-info-row">
        <div v-if="!isOnline" class="offline-info">
          <span class="live-dot offline"></span>
          <span>Koneksi ke server terputus</span>
        </div>

        <div v-if="totalPages > 1" class="page-indicator">
          Halaman {{ currentPage + 1 }} / {{ totalPages }}
        </div>
      </div>

      <div class="queue-table-wrap">
        <table class="queue-table">
          <thead>
            <tr>
              <th>Token</th>
              <th>Nomor Plat</th>
              <th>Status</th>
            </tr>
          </thead>

          <tbody>
            <tr v-for="item in paginatedQueues" :key="item.id">
              <td>
                <span class="token-number">
                  {{ String(item.token_number || '').padStart(2, '0') }}
                </span>
              </td>
              <td class="plate-cell">{{ item.plat_number }}</td>
              <td>
                <span class="status" :class="statusClass(item.status)">
                  {{ statusLabel(item.status) }}
                </span>
              </td>
            </tr>

            <tr v-if="queues.length === 0">
              <td colspan="3" class="empty-row">
                {{ isOnline ? 'Belum ada antrean aktif' : 'Menunggu koneksi ke server...' }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <footer class="queue-footer">
        <span>{{ queues.length }} kendaraan aktif</span>
        <span v-if="lastUpdated">Pembaruan terakhir {{ lastUpdated }}</span>
      </footer>
    </main>
  </div>
</template>

<script setup>
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from 'vue'
import api from '../services/api'

/* =========================================================
   KONFIGURASI DISPLAY
   ========================================================= */
const QUEUE_POLL_MS = 2000
const PAGE_ROTATE_MS = 8000
const MEDIA_REFRESH_MS = 60000
const PAGE_SIZE = 10

// Audio iklan: volume normal dapat diubah dari kontrol pada layar.
// Saat TTS antrean berbicara, volume video otomatis di-ducking.
const AD_VOLUME_DEFAULT = 0.85
const AD_VOLUME_DUCKED = 0.12
const AUDIO_FADE_MS = 280

/* =========================================================
   STATE ANTREAN
   ========================================================= */
const queues = ref([])
const oldQueues = ref([])
const now = ref(new Date())
const lastUpdated = ref('')
const currentPage = ref(0)
const isOnline = ref(navigator.onLine)
let isFirstLoad = true

/* =========================================================
   STATE MEDIA IKLAN
   Daftar video dibaca otomatis dari backend get_ads.
   Backend men-scan /srv/geckowash-media/ads sehingga tidak
   diperlukan playlist.json.
   ========================================================= */
const videoRef = ref(null)
const mediaItems = ref([])
const currentMediaIndex = ref(0)
const failedMedia = ref(new Set())
const mediaMessage = ref('Memuat media iklan...')
const mediaPlaybackBlocked = ref(false)
const mediaVolume = ref(AD_VOLUME_DEFAULT)
const isMediaMuted = ref(false)

// Antrean pengumuman suara agar beberapa perubahan status dibacakan satu per satu.
const speechQueue = []
let isSpeakingQueue = false
let volumeFadeFrame = null

let queueTimer = null
let clockTimer = null
let pageTimer = null
let mediaTimer = null

const currentMedia = computed(() => mediaItems.value[currentMediaIndex.value] || null)
const hasMedia = computed(() => Boolean(currentMedia.value))

const currentMediaSrc = computed(() => {
  const item = currentMedia.value
  if (!item) return ''
  return item.url || ''
})

const mediaVolumePercent = computed(() => Math.round(mediaVolume.value * 100))

/* =========================================================
   JAM / TANGGAL
   ========================================================= */
const currentTime = computed(() =>
  now.value.toLocaleTimeString('id-ID', {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Asia/Makassar',
    hour12: false
  })
)

const currentDate = computed(() =>
  now.value.toLocaleDateString('id-ID', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    timeZone: 'Asia/Makassar'
  })
)

/* =========================================================
   PAGINATION ANTREAN TV
   ========================================================= */
const totalPages = computed(() => Math.max(1, Math.ceil(queues.value.length / PAGE_SIZE)))

const paginatedQueues = computed(() => {
  const start = currentPage.value * PAGE_SIZE
  return queues.value.slice(start, start + PAGE_SIZE)
})

watch(totalPages, pages => {
  if (currentPage.value >= pages) currentPage.value = 0
})

const rotatePage = () => {
  if (totalPages.value <= 1) {
    currentPage.value = 0
    return
  }
  currentPage.value = (currentPage.value + 1) % totalPages.value
}

/* =========================================================
   LABEL STATUS
   FINISH ditampilkan sebagai SIAP DIAMBIL agar mudah dipahami
   pelanggan pada layar TV.
   ========================================================= */
const statusLabel = status => ({
  ANTRI: 'Menunggu',
  'PROSES CUCI': 'Proses Cuci',
  PENGERINGAN: 'Pengeringan',
  FINISH: 'Siap Diambil',
  SELESAI: 'Selesai'
}[status] || status)

const statusClass = status => ({
  ANTRI: 'waiting',
  'PROSES CUCI': 'washing',
  PENGERINGAN: 'drying',
  FINISH: 'ready',
  SELESAI: 'done'
}[status] || 'waiting')

/* =========================================================
   MEDIA IKLAN DARI STB
   Backend get_ads men-scan folder /srv/geckowash-media/ads.
   Tambah/hapus/rename file video di STB akan otomatis terbaca
   pada refresh daftar media berikutnya.
   ========================================================= */
const normalizeAds = raw => {
  const source = Array.isArray(raw)
    ? raw
    : (Array.isArray(raw?.videos) ? raw.videos : [])

  return source
    .map(item => {
      if (typeof item === 'string') {
        return { file: item.trim(), url: '' }
      }

      if (item && typeof item === 'object') {
        return {
          file: String(item.file || '').trim(),
          url: String(item.url || '').trim()
        }
      }

      return null
    })
    .filter(item => item && item.file)
    .filter(item => /\.(mp4|webm|ogg)$/i.test(item.file))
}

const loadAds = async () => {
  try {
    const response = await api.getAds()
    const parsed = normalizeAds(response.data)

    if (parsed.length === 0) {
      mediaItems.value = []
      currentMediaIndex.value = 0
      failedMedia.value = new Set()
      mediaMessage.value = 'Belum ada video iklan di STB'
      return
    }

    // Jika video yang sedang berjalan masih ada dalam hasil scan terbaru,
    // pertahankan video tersebut agar penambahan file baru tidak memotong playback.
    const previousFile = currentMedia.value?.file
    mediaItems.value = parsed
    failedMedia.value = new Set()

    const previousIndex = previousFile
      ? parsed.findIndex(item => item.file === previousFile)
      : -1

    currentMediaIndex.value = previousIndex >= 0 ? previousIndex : 0
    mediaMessage.value = ''

    await nextTick()
    attemptMediaPlayback()
  } catch (error) {
    console.error('Gagal mengambil daftar media iklan dari STB:', error)

    if (mediaItems.value.length === 0) {
      mediaMessage.value = 'Media iklan belum tersedia di server'
    }
  }
}

const clampVolume = volume => Math.max(0, Math.min(1, Number(volume) || 0))

const currentTargetVolume = () => {
  if (isSpeakingQueue) return Math.min(mediaVolume.value, AD_VOLUME_DUCKED)
  return mediaVolume.value
}

const setVideoVolume = volume => {
  const video = videoRef.value
  if (!video) return

  video.volume = clampVolume(volume)
  video.muted = isMediaMuted.value
}

const fadeVideoVolume = (targetVolume, duration = AUDIO_FADE_MS) => {
  const video = videoRef.value
  if (!video) return

  if (volumeFadeFrame) cancelAnimationFrame(volumeFadeFrame)

  const startVolume = Number.isFinite(video.volume) ? video.volume : mediaVolume.value
  const target = clampVolume(targetVolume)
  const startedAt = performance.now()

  const step = timestamp => {
    const progress = Math.min(1, (timestamp - startedAt) / duration)
    video.volume = startVolume + ((target - startVolume) * progress)
    video.muted = isMediaMuted.value

    if (progress < 1) {
      volumeFadeFrame = requestAnimationFrame(step)
    } else {
      volumeFadeFrame = null
    }
  }

  volumeFadeFrame = requestAnimationFrame(step)
}

const duckMediaAudio = () => {
  fadeVideoVolume(Math.min(mediaVolume.value, AD_VOLUME_DUCKED))
}

const restoreMediaAudio = () => {
  fadeVideoVolume(mediaVolume.value)
}

const applyMediaVolume = () => {
  mediaVolume.value = clampVolume(mediaVolume.value)

  // Menggeser volume dianggap sebagai interaksi pengguna; jika audio sebelumnya
  // diblokir browser, coba buka audio sekaligus.
  if (mediaPlaybackBlocked.value) {
    activateDisplayAudio()
    return
  }

  setVideoVolume(currentTargetVolume())
}

const adjustMediaVolume = delta => {
  mediaVolume.value = clampVolume(Math.round((mediaVolume.value + delta) * 100) / 100)
  if (mediaVolume.value > 0) isMediaMuted.value = false
  applyMediaVolume()
}

const toggleMediaMute = () => {
  // Saat audio diblokir browser, tombol speaker berfungsi sebagai tombol aktivasi.
  if (mediaPlaybackBlocked.value) {
    activateDisplayAudio()
    return
  }

  isMediaMuted.value = !isMediaMuted.value
  const video = videoRef.value
  if (!video) return

  video.muted = isMediaMuted.value
}

// Mencoba autoplay dengan audio terlebih dahulu. Jika kebijakan browser desktop
// menolaknya, video tetap diputar mute dan tombol aktivasi audio ditampilkan.
const attemptMediaPlayback = async () => {
  const video = videoRef.value
  if (!video) return

  setVideoVolume(currentTargetVolume())

  try {
    video.muted = isMediaMuted.value
    await video.play()
    mediaPlaybackBlocked.value = false
  } catch (error) {
    console.warn('Autoplay dengan suara diblokir browser. Beralih ke video mute:', error)

    try {
      video.muted = true
      await video.play()
      mediaPlaybackBlocked.value = true
    } catch (mutedError) {
      console.warn('Autoplay video juga belum dapat dimulai:', mutedError)
      mediaPlaybackBlocked.value = true
    }
  }
}

// Dipanggil sekali melalui klik saat Chrome/Vite memblokir autoplay dengan audio.
// Interaksi yang sama juga membantu membuka SpeechSynthesis untuk pengumuman antrean.
const activateDisplayAudio = async () => {
  const video = videoRef.value
  if (!video) return

  try {
    isMediaMuted.value = false
    video.muted = false
    video.volume = currentTargetVolume()
    await video.play()
    mediaPlaybackBlocked.value = false

    if ('speechSynthesis' in window) {
      window.speechSynthesis.resume()
    }
  } catch (error) {
    console.warn('Audio belum dapat diaktifkan:', error)
    mediaPlaybackBlocked.value = true
  }
}

const handleMediaReady = () => {
  attemptMediaPlayback()
}

const nextMedia = async () => {
  if (mediaItems.value.length <= 1) {
    if (videoRef.value) {
      videoRef.value.currentTime = 0
      attemptMediaPlayback()
    }
    return
  }

  currentMediaIndex.value = (currentMediaIndex.value + 1) % mediaItems.value.length
  await nextTick()
  attemptMediaPlayback()
}

const handleMediaError = async () => {
  const failed = currentMedia.value
  if (!failed) return

  const newFailedSet = new Set(failedMedia.value)
  newFailedSet.add(failed.file)
  failedMedia.value = newFailedSet

  console.error(`Media gagal diputar: ${failed.file}`)

  if (failedMedia.value.size >= mediaItems.value.length) {
    mediaItems.value = []
    currentMediaIndex.value = 0
    mediaMessage.value = 'Video iklan tidak dapat diputar'
    return
  }

  let nextIndex = currentMediaIndex.value

  for (let i = 0; i < mediaItems.value.length; i += 1) {
    nextIndex = (nextIndex + 1) % mediaItems.value.length
    const candidate = mediaItems.value[nextIndex]

    if (!failedMedia.value.has(candidate.file)) {
      currentMediaIndex.value = nextIndex
      await nextTick()
      attemptMediaPlayback()
      return
    }
  }
}

/* =========================================================
   PENGUMUMAN SUARA + AUDIO DUCKING
   - Video iklan tetap bersuara pada volume normal.
   - Saat TTS antrean mulai, volume iklan diturunkan sementara.
   - Setelah seluruh antrean TTS selesai, volume iklan kembali normal.
   Catatan: autoplay dengan audio tanpa klik tetap bergantung pada izin
   kiosk browser/WebView Android TV yang digunakan.
   ========================================================= */
const buildSpeech = text => {
  const speech = new SpeechSynthesisUtterance(text)
  speech.lang = 'id-ID'
  speech.rate = 0.86
  speech.pitch = 1
  speech.volume = 1

  const voices = window.speechSynthesis.getVoices()
  const indonesiaVoice = voices.find(voice =>
    String(voice.lang || '').toLowerCase().startsWith('id')
  )

  if (indonesiaVoice) speech.voice = indonesiaVoice
  return speech
}

const processSpeechQueue = () => {
  if (isSpeakingQueue || speechQueue.length === 0) return
  if (!('speechSynthesis' in window) || !('SpeechSynthesisUtterance' in window)) {
    speechQueue.length = 0
    restoreMediaAudio()
    return
  }

  const text = speechQueue.shift()
  const speech = buildSpeech(text)
  isSpeakingQueue = true

  speech.onstart = () => {
    duckMediaAudio()
  }

  const finishSpeech = () => {
    isSpeakingQueue = false

    if (speechQueue.length > 0) {
      // Tetap pertahankan volume iklan rendah sampai semua pengumuman selesai.
      setVideoVolume(Math.min(mediaVolume.value, AD_VOLUME_DUCKED))
      processSpeechQueue()
    } else {
      restoreMediaAudio()
    }
  }

  speech.onend = finishSpeech
  speech.onerror = event => {
    console.error('Gagal menjalankan pengumuman suara:', event)
    finishSpeech()
  }

  try {
    window.speechSynthesis.resume()
    window.speechSynthesis.speak(speech)
  } catch (error) {
    console.error('Gagal menjalankan pengumuman suara:', error)
    finishSpeech()
  }
}

const speak = text => {
  if (!text) return
  if (!('speechSynthesis' in window) || !('SpeechSynthesisUtterance' in window)) return

  speechQueue.push(text)
  processSpeechQueue()
}

const announceStatusChange = (item, previousStatus) => {
  if (item.status === previousStatus) return

  if (item.status === 'PROSES CUCI') {
    speak(`Nomor polisi ${item.plat_number}. Kendaraan mulai proses cuci.`)
  } else if (item.status === 'PENGERINGAN') {
    speak(`Nomor polisi ${item.plat_number}. Kendaraan masuk proses pengeringan.`)
  } else if (item.status === 'FINISH') {
    speak(`Nomor polisi ${item.plat_number}. Pencucian sudah selesai. Kendaraan siap diambil.`)
  }
}

const checkStatusChanges = newData => {
  if (isFirstLoad) {
    oldQueues.value = newData.map(item => ({ ...item }))
    isFirstLoad = false
    return
  }

  // Kendaraan baru atau mengalami perubahan status.
  newData.forEach(item => {
    const previous = oldQueues.value.find(queue => queue.id === item.id)

    if (!previous) {
      speak(`Nomor polisi ${item.plat_number}. Kendaraan telah masuk antrean Gecko Wash.`)
      return
    }

    announceStatusChange(item, previous.status)
  })

  // Endpoint get_queues hanya mengembalikan antrean aktif. Setelah status FINISH
  // diselesaikan oleh operator/RFID menjadi SELESAI, kendaraan hilang dari respons.
  // Karena itu, deteksi kendaraan yang sebelumnya FINISH lalu tidak lagi muncul
  // digunakan untuk memutar ucapan penutup kepada pelanggan.
  oldQueues.value.forEach(previous => {
    const stillActive = newData.some(item => item.id === previous.id)

    if (!stillActive && previous.status === 'FINISH') {
      speak(`Terima kasih. Nomor polisi ${previous.plat_number}. Terima kasih sudah mencuci di Gecko Wash Touchless. Hati-hati di jalan.`)
    }
  })

  oldQueues.value = newData.map(item => ({ ...item }))
}

/* =========================================================
   POLLING DATA ANTREAN
   ========================================================= */
const fetchQueues = async () => {
  try {
    const response = await api.getQueues()
    const data = Array.isArray(response.data) ? response.data : []

    checkStatusChanges(data)
    queues.value = data
    isOnline.value = true

    lastUpdated.value = new Date().toLocaleTimeString('id-ID', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      timeZone: 'Asia/Makassar',
      hour12: false
    })
  } catch (error) {
    console.error('Gagal memperbarui antrean:', error)
    isOnline.value = false
  }
}

/* =========================================================
   PEMULIHAN SETELAH TV SLEEP / JARINGAN KEMBALI
   ========================================================= */
const handleVisibilityChange = () => {
  if (document.visibilityState === 'visible') {
    now.value = new Date()
    fetchQueues()
    attemptMediaPlayback()
  }
}

const handleOnline = () => {
  isOnline.value = true
  fetchQueues()
  loadAds()
  attemptMediaPlayback()
}

const handleOffline = () => {
  isOnline.value = false
}

onMounted(() => {
  fetchQueues()
  loadAds()

  queueTimer = setInterval(fetchQueues, QUEUE_POLL_MS)
  clockTimer = setInterval(() => { now.value = new Date() }, 15000)
  pageTimer = setInterval(rotatePage, PAGE_ROTATE_MS)
  mediaTimer = setInterval(loadAds, MEDIA_REFRESH_MS)

  document.addEventListener('visibilitychange', handleVisibilityChange)
  window.addEventListener('online', handleOnline)
  window.addEventListener('offline', handleOffline)
})

onUnmounted(() => {
  clearInterval(queueTimer)
  clearInterval(clockTimer)
  clearInterval(pageTimer)
  clearInterval(mediaTimer)

  document.removeEventListener('visibilitychange', handleVisibilityChange)
  window.removeEventListener('online', handleOnline)
  window.removeEventListener('offline', handleOffline)

  speechQueue.length = 0
  isSpeakingQueue = false

  if (volumeFadeFrame) {
    cancelAnimationFrame(volumeFadeFrame)
    volumeFadeFrame = null
  }

  if ('speechSynthesis' in window) window.speechSynthesis.cancel()
})
</script>

<style scoped>
*{box-sizing:border-box}

.tv-display{
  height:100vh;
  min-height:620px;
  overflow:hidden;
  background:#0f1420;
  color:#171b26;
  display:grid;
  grid-template-columns:minmax(390px,32%) minmax(0,1fr);
  font-family:Inter,ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;
}

/* =========================================================
   PANEL MEDIA IKLAN PORTRAIT
   ========================================================= */
.ad-panel{
  position:relative;
  height:100vh;
  overflow:hidden;
  background:linear-gradient(165deg,#111827 0%,#17243b 50%,#0b1220 100%);
  border-right:1px solid rgba(255,255,255,.08);
}

.ad-video{
  width:100%;
  height:100%;
  display:block;
  object-fit:cover;
  background:#0b1220;
}

.media-counter{
  position:absolute;
  right:18px;
  bottom:18px;
  padding:7px 11px;
  border-radius:999px;
  background:rgba(8,13,24,.58);
  color:#fff;
  font-size:12px;
  font-weight:750;
  letter-spacing:.3px;
  backdrop-filter:blur(8px);
}

.audio-activate{
  position:absolute;
  left:50%;
  top:50%;
  transform:translate(-50%,-50%);
  display:flex;
  align-items:center;
  gap:13px;
  min-width:245px;
  padding:14px 18px;
  border:1px solid rgba(255,255,255,.28);
  border-radius:16px;
  background:rgba(8,13,24,.82);
  color:#fff;
  cursor:pointer;
  text-align:left;
  backdrop-filter:blur(12px);
  box-shadow:0 16px 36px rgba(0,0,0,.32);
  z-index:4;
}

.audio-activate:hover{background:rgba(8,13,24,.92)}
.audio-activate-icon{font-size:24px;line-height:1}
.audio-activate strong{display:block;font-size:14px;font-weight:850}
.audio-activate small{display:block;margin-top:2px;color:#cbd5e1;font-size:11px;font-weight:600}

.media-controls{
  position:absolute;
  left:16px;
  bottom:16px;
  display:flex;
  align-items:center;
  gap:7px;
  max-width:calc(100% - 92px);
  padding:8px 9px;
  border:1px solid rgba(255,255,255,.14);
  border-radius:14px;
  background:rgba(8,13,24,.62);
  color:#fff;
  backdrop-filter:blur(10px);
  z-index:3;
}

.volume-btn{
  width:34px;
  height:34px;
  flex:0 0 auto;
  display:grid;
  place-items:center;
  border:0;
  border-radius:9px;
  background:rgba(255,255,255,.12);
  color:#fff;
  font-size:16px;
  font-weight:850;
  cursor:pointer;
}

.volume-btn:hover{background:rgba(255,255,255,.20)}
.volume-btn.compact{font-size:20px;line-height:1}

.volume-slider{
  width:110px;
  min-width:70px;
  accent-color:#fff;
  cursor:pointer;
}

.volume-value{
  min-width:38px;
  color:#fff;
  font-size:11px;
  font-weight:800;
  text-align:right;
}

.ad-placeholder{
  height:100%;
  display:flex;
  align-items:center;
  justify-content:center;
  flex-direction:column;
  text-align:center;
  color:#fff;
  padding:40px;
}

.ad-placeholder-logo{
  width:88px;
  height:88px;
  border-radius:25px;
  display:grid;
  place-items:center;
  background:#fff;
  color:#171b26;
  font-size:50px;
  font-weight:900;
  margin-bottom:22px;
  box-shadow:0 18px 38px rgba(0,0,0,.24);
}

.ad-placeholder strong{
  font-size:24px;
  letter-spacing:.3px;
}

.ad-placeholder span{
  margin-top:10px;
  max-width:290px;
  color:#c6cedc;
  font-size:14px;
  line-height:1.5;
}

/* =========================================================
   AREA ANTREAN — MEMPERTAHANKAN GAYA DISPLAY LAMA
   ========================================================= */
.queue-main{
  min-width:0;
  height:100vh;
  background:#f7f8fa;
  padding:30px 38px 22px;
  display:flex;
  flex-direction:column;
}

.queue-header{
  display:flex;
  justify-content:space-between;
  align-items:center;
  gap:25px;
  margin:0 0 20px;
  flex:0 0 auto;
}

.brand-copy{min-width:0}

.wordmark{
  font-size:clamp(24px,1.72vw,34px);
  letter-spacing:-.7px;
  font-weight:850;
  color:#171b26;
  white-space:nowrap;
}

.queue-header p{
  margin:4px 0 0;
  color:#737b89;
  font-size:clamp(14px,1vw,19px);
}

.queue-clock{
  text-align:right;
  min-width:245px;
}

.queue-clock h1{
  font-size:clamp(20px,1.35vw,27px);
  margin:0 0 2px;
  font-weight:780;
  color:#171b26;
}

.queue-clock time{
  display:block;
  font-size:clamp(18px,1.2vw,23px);
  font-weight:820;
  color:#2864d7;
}

.current-date{
  display:block;
  margin-top:2px;
  font-size:12px;
  color:#7b8290;
  font-weight:650;
}

.queue-info-row{
  display:flex;
  align-items:center;
  justify-content:space-between;
  gap:18px;
  margin-bottom:12px;
  color:#6d7583;
  font-size:13px;
  font-weight:650;
  flex:0 0 auto;
}

.offline-info{
  display:flex;
  align-items:center;
  gap:8px;
  white-space:nowrap;
  color:#b13a3a;
}

.live-dot{
  width:8px;
  height:8px;
  border-radius:50%;
  background:#25a85a;
  box-shadow:0 0 0 4px rgba(37,168,90,.10);
}

.live-dot.offline{
  background:#d84848;
  box-shadow:0 0 0 4px rgba(216,72,72,.10);
}


.page-indicator{
  background:#edf3ff;
  color:#2d5eaf;
  padding:7px 11px;
  border-radius:9px;
  font-weight:750;
}

.queue-table-wrap{
  background:white;
  border:1px solid #e1e4e9;
  border-radius:22px;
  overflow:hidden;
  box-shadow:0 8px 18px rgba(23,32,53,.035);
  flex:1 1 auto;
  min-height:0;
}

.queue-table{
  width:100%;
  height:auto;
  border-collapse:collapse;
  text-align:left;
  table-layout:fixed;
}

.queue-table thead{background:#fafbfc}

.queue-table th{
  height:58px;
  color:#747b88;
  font-size:14px;
  font-weight:750;
  border-bottom:1px solid #e1e4e9;
  text-transform:none;
}

.queue-table td,.queue-table th{padding:0 22px}
.queue-table th:first-child,.queue-table td:first-child{width:125px}
.queue-table th:last-child,.queue-table td:last-child{width:190px}
.queue-table tbody tr{height:64px;min-height:64px;max-height:64px;background:#f1f2f4}
.queue-table tbody td{height:64px;min-height:64px;max-height:64px}
.queue-table tbody tr:nth-child(even){background:#f7f8fa}
.queue-table tbody tr+tr{border-top:1px solid #e1e4e9}

.queue-table td{
  font-size:clamp(16px,1.12vw,22px);
  font-weight:680;
}

.token-number{
  display:inline-grid;
  place-items:center;
  min-width:58px;
  height:38px;
  padding:0 11px;
  border-radius:11px;
  background:#171b26;
  color:#fff;
  font-weight:850;
  letter-spacing:.8px;
}

.plate-cell{
  font-size:clamp(21px,1.58vw,30px)!important;
  letter-spacing:.4px;
  font-weight:850!important;
  color:#171b26;
}

.status{
  display:inline-flex;
  align-items:center;
  justify-content:center;
  min-width:122px;
  padding:8px 14px;
  border-radius:20px;
  font-size:clamp(12px,.82vw,15px);
  font-weight:800;
  white-space:nowrap;
}

.status.done,.status.ready{color:#16723b;background:#d9fbe5}
.status.waiting{color:#8b6413;background:#fff0c4}
.status.washing{color:#235ab4;background:#e3efff}
.status.drying{color:#98511b;background:#ffead8}

.empty-row{
  text-align:center;
  color:#777f8d;
  font-size:17px!important;
  font-weight:550!important;
  background:#fff!important;
}

.queue-footer{
  display:flex;
  justify-content:space-between;
  gap:20px;
  padding:13px 4px 0;
  color:#7b8290;
  font-size:12px;
  font-weight:650;
  flex:0 0 auto;
}

/* Laptop / browser preview */
@media (max-width:1150px){
  .tv-display{grid-template-columns:minmax(300px,31%) minmax(0,1fr)}
  .queue-main{padding:24px 24px 18px}
  .queue-header{align-items:flex-start;flex-direction:column;gap:10px}
  .queue-clock{text-align:left;min-width:0}
  .queue-table th:first-child,.queue-table td:first-child{width:100px}
  .queue-table th:last-child,.queue-table td:last-child{width:150px}
  .queue-table td,.queue-table th{padding:0 14px}
}

/* Preview layar kecil. Target utama tetap TV landscape. */
@media (max-width:820px){
  .tv-display{
    height:auto;
    min-height:100vh;
    overflow:auto;
    display:block;
    background:#f7f8fa;
  }

  .ad-panel{
    height:54vh;
    min-height:420px;
    border-right:0;
    border-bottom:1px solid rgba(255,255,255,.08);
  }

  .queue-main{
    height:auto;
    min-height:100vh;
    padding:22px 15px;
  }

  .wordmark{white-space:normal}
  .queue-info-row{align-items:flex-start;flex-direction:column}
  .media-controls{max-width:calc(100% - 32px)}
  .volume-slider{width:90px}
  .queue-table-wrap{min-height:520px;overflow-x:auto}
  .queue-table{min-width:620px}
}
</style>
