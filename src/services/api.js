import axios from 'axios'
import { toBRDate } from '../utils/helpers'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'https://semdesperdicio.smartru.com.br/api',
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true, // envia cookies HttpOnly automaticamente
})

// ─── Interceptor de refresh automático ────────────────
let isRefreshing = false
let failedQueue = []

const processQueue = (error) => {
  failedQueue.forEach((prom) => {
    if (error) prom.reject(error)
    else prom.resolve()
  })
  failedQueue = []
}

api.interceptors.response.use(
  (res) => res,
  async (err) => {
    const originalRequest = err.config
    const status = err.response?.status

    // 429 = rate limit → não tratar como sessão expirada
    if (status === 429) {
      return Promise.reject(err)
    }

    // 403 = sem permissão → não tenta refresh
    if (status === 403) {
      return Promise.reject(err)
    }

    // 401 = sessão expirada → tenta refresh uma única vez
    // Ignora 401 no login (credenciais inválidas não devem tentar refresh)
    if (
      status === 401 &&
      !originalRequest._retry &&
      !originalRequest.url?.includes('/user/login')
    ) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject })
        })
          .then(() => api(originalRequest))
          .catch((e) => Promise.reject(e))
      }

      originalRequest._retry = true
      isRefreshing = true

      try {
        await api.post('/user/refresh')
        processQueue(null)
        return api(originalRequest)
      } catch (refreshErr) {
        processQueue(refreshErr)
        localStorage.removeItem('smartru_user')
        window.location.href = '/login'
        return Promise.reject(refreshErr)
      } finally {
        isRefreshing = false
      }
    }

    return Promise.reject(err)
  }
)

// ─── Auth ─────────────────────────────────────────────
export const authAPI = {
  login: (data) => api.post('/user/login', data),
  register: (data) => api.post('/user/register', data),
  logout: () => api.post('/user/logout'),
  refresh: () => api.post('/user/refresh'),
}

// ─── Usuário ──────────────────────────────────────────
export const userAPI = {
  getAll: () => api.get('/users'),
  count: () => api.get('/users/count'),
  updatePassword: (data) => api.put('/user/update_password', data),
  deleteAccount: (cpf) => api.delete('/user/delete', { data: { cpf } }),
  passwordRecover: (data) => api.post('/user/password_recover', data),
  passwordReset: (data) => api.post('/user/password_reset', data),
}

// ─── Agendamentos ─────────────────────────────────────
export const scheduleAPI = {
  create: (data) => api.post('/schedule/register', data),
  update: (data) => api.put('/schedule/update', data),
  confirm: (data) => api.put('/schedule/confirm', data),
  cancel: (data) => api.delete('/schedule/delete', { data }),
  mySchedules: () => api.get('/schedule/me'),
  allSchedules: (date) =>
    api.get('/schedule/all', {
      params: date ? { date } : {},
    }),
}

// ─── Cardápio ─────────────────────────────────────────
export const menuAPI = {
  upload: (formData) =>
    api.post('/menu/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  current: () => api.get('/menu/current'),
  image: (menuId, mealType = 'lunch') =>
    api.get(`/menu/image/${menuId}/${mealType}`, { responseType: 'blob' }),
}

// ─── Dispositivo ──────────────────────────────────────
export const deviceAPI = {
  register: (data) => api.post('/device/register', data),
}

// ─── Notificações ─────────────────────────────────────
export const notificationAPI = {
  dailyReminder: () => api.post('/notification/daily-reminder/trigger'),
  queueCollaboration: (data) => api.post('/notification/queue-collaboration/trigger', data),
  listJobs: () => api.get('/notification/jobs'),
  getJob: (jobId) => api.get(`/notification/jobs/${jobId}`),
}

// ─── Avisos (Admin → e-mail dos cadastrados) ─────────
export const announcementAPI = {
  list: () => api.get('/admin/announcements'),
  create: (data) => api.post('/admin/announcements', data),
  update: (id, data) => api.put(`/admin/announcements/${id}`, data),
  remove: (id) => api.delete(`/admin/announcements/${id}`),
  notify: (id) => api.post(`/admin/announcements/${id}/notify`),
  publicList: () => api.get('/announcements'),
}

// ─── Vouchers ─────────────────────────────────────────
export const voucherAPI = {
  mine: () => api.get('/voucher/my'),
  generate: (targetCpf) => api.post('/voucher/generate', { target_cpf: targetCpf || null }),
  availableWinners: () => api.get('/voucher/available-winners'),
  publicKey: () => api.get('/voucher/public-key'),
  validate: (data) => api.post('/voucher/validate', data),
  sync: (usages) => api.post('/voucher/sync', { usages }),
}

// ─── Relatórios ───────────────────────────────────────
export const reportAPI = {
  demand: (date) => {
    const brDate = toBRDate(date)
    return api.get('/reports/demand', { params: { date: brDate } })
  },
  export: (date) => {
    const brDate = toBRDate(date)
    return api.get('/reports/export', { params: { date: brDate }, responseType: 'blob' })
  },
  consumption: (startDate, endDate = null) => {
    const params = { start_date: toBRDate(startDate) }
    if (endDate) params.end_date = toBRDate(endDate)
    return api.get('/report/consumption', { params })
  },
}

// ─── Ranking / Leaderboard ────────────────────────────
export const rankingAPI = {
  list: (mes, page = 1, limit = 10) => api.get('/ranking', { params: { mes, page, limit } }),
  winner: (mes) => api.get('/ranking/winner', { params: { mes } }),
  importCsv: (file) => {
    const form = new FormData()
    form.append('file', file)
    return api.post('/ranking/import-csv', form)
  },
  setWinner: (year, month, user_cpf) => api.post('/ranking/winner', { year, month, user_cpf }),
  // Raffle / Sorteio
  raffleCreate: (name, startDate, endDate, numWinners = 1) =>
    api.post('/ranking/raffle/create', {
      name,
      start_date: startDate,
      end_date: endDate,
      num_winners: numWinners,
    }),
  raffleList: (status = null) => api.get('/ranking/raffles', { params: status ? { status } : {} }),
  raffleDraw: (raffleId) => api.post(`/ranking/raffle/${raffleId}/draw`),
  raffleWinners: (raffleId) => api.get(`/ranking/raffle/${raffleId}/winners`),
}

// ─── Campanha / Roleta ───────────────────────────────
export const campaignAPI = {
  list: () => api.get('/campaign'),
  get: (id) => api.get(`/campaign/${id}`),
  create: (data) => api.post('/campaign', data),
  computeStats: (id) => api.post(`/campaign/${id}/compute-stats`),
  participants: (id, onlyEligible = false) =>
    api.get(`/campaign/${id}/participants`, { params: { only_eligible: onlyEligible } }),
  spin: (id) => api.post(`/campaign/${id}/spin`),
  confirmSpin: (spinId, userCpf = null) =>
    api.post(`/campaign/spin/${spinId}/confirm`, null, {
      params: userCpf ? { user_cpf: userCpf } : {},
    }),
  cancelSpin: (spinId) => api.post(`/campaign/spin/${spinId}/cancel`),
  registerVoucher: (spinId, userCpf) =>
    api.post(`/campaign/spin/${spinId}/voucher`, { user_cpf: userCpf }),
  getVoucher: (voucherId) => api.get(`/campaign/voucher/${voucherId}`),
  useVoucher: (voucherId, nonce, signatureHex, mealType = 'lunch') =>
    api.post(
      `/campaign/voucher/${voucherId}/use`,
      buildEventVoucherUsePayload(nonce, signatureHex, mealType)
    ),
  listVouchers: (campaignId = null) =>
    api.get('/campaign/vouchers', { params: campaignId ? { campaign_id: campaignId } : {} }),
  myVoucher: () => api.get('/campaign/my-voucher'),
  myProgress: () => api.get('/campaign/my-progress'),
}

export function buildEventVoucherUsePayload(nonce, signatureHex, mealType = 'lunch') {
  return { meal_type: mealType, nonce, signature_hex: signatureHex }
}

export default api
