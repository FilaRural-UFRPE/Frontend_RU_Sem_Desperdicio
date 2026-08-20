import axios from 'axios'

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
    if (status === 401 && !originalRequest._retry) {
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
  allSchedules: (date) => api.get('/schedule/all', {
    params: date ? { date } : {}
  }),
}

// ─── Cardápio ─────────────────────────────────────────
export const menuAPI = {
  upload: (formData) => api.post('/menu/upload', formData, {
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

// ─── Relatórios ───────────────────────────────────────
function toBRDate(dateStr) {
  if (!dateStr) return ''
  if (dateStr.includes('/')) return dateStr
  const [y, m, d] = dateStr.split('-')
  return `${d}/${m}/${y}`
}

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

export default api
