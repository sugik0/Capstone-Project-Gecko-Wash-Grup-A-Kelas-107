import axios from 'axios'

const apiClient = axios.create({
  baseURL: 'https://api.geckowash.my.id/backend/',
  headers: {
    'Content-Type': 'application/json',
    'X-API-Key': 'KODE_RAHASIA_GECKO_2026'
  }
})

export default {
  // ANTREAN
  getQueues() {
    return apiClient.get('api.php?action=get_queues')
  },

  checkin(payload) {
    return apiClient.post('api.php?action=checkin', payload)
  },

  pay(id) {
    return apiClient.post('api.php?action=pay', { id })
  },

  editPlat(id, plat_number) {
    return apiClient.post('api.php?action=edit_queue', { id, plat_number })
  },

  cancelQueue(id) {
    return apiClient.post('api.php?action=cancel_queue', { id })
  },

  // RFID / SIMULATOR
  tapRfid(token) {
    return apiClient.post('api.php?action=tap_rfid', { token })
  },

  addRfid(payload) {
    return apiClient.post('api.php?action=add_rfid', payload)
  },

  updateRfidUid(payload) {
    return apiClient.post('api.php?action=update_rfid_uid', payload)
  },

  deleteRfid(token_number) {
    return apiClient.post('api.php?action=delete_rfid', { token_number })
  },

  // Endpoint lama tetap tersedia jika sewaktu-waktu diperlukan.
  updateRfidStatus(payload) {
    return apiClient.post('api.php?action=update_rfid_status', payload)
  },

  // MEDIA IKLAN DISPLAY
  getAds() {
    return apiClient.get('api.php?action=get_ads')
  },

  // LAPORAN
  getReports(date) {
    return apiClient.get(`api.php?action=get_reports&date=${encodeURIComponent(date)}`)
  },

  // PENGATURAN
  getSettings() {
    return apiClient.get('api.php?action=get_settings')
  },

  saveMotorType(payload) {
    return apiClient.post('api.php?action=save_motor_type', payload)
  },

  deleteMotorType(id) {
    return apiClient.post('api.php?action=delete_motor_type', { id })
  },

  saveSystemConfig(payload) {
    return apiClient.post('api.php?action=save_system_config', payload)
  },

  // LANDING PAGE
  checkStatus(plat) {
    return apiClient.get(
      `api.php?action=check_status&plat_number=${encodeURIComponent(plat)}`
    )
  }
}
