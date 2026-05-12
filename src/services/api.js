import axios from 'axios'

const api = axios.create({
  baseURL: 'https://semdesperdicio.smartru.com.br/api',
  headers: { 'Content-Type': 'application/json' },
})

// Injeta token JWT em todas as requisições autenticadas
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('smartru_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// Se token expirar (401), redireciona para login
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('smartru_token')
      localStorage.removeItem('smartru_user')
      window.location.href = '/login'
    }
    return Promise.reject(err)
  }
)

// ─── Auth ─────────────────────────────────────────────
export const authAPI = {
  login: (data) => api.post('/user/login', data),
  register: (data) => api.post('/user/register', data),
}

// ─── Usuário ──────────────────────────────────────────
export const userAPI = {
  getAll: () => api.get('/users'),
  updatePassword: (data) => api.put('/user/update_password', data),
  deleteAccount: (cpf) => api.delete('/user/delete', { data: { cpf } }),
  passwordRecover: (data) => api.post('/user/password_recover', data),
  passwordReset: (data) => api.post('/user/password_reset', data),
}

// ─── Agendamentos ─────────────────────────────────────
export const scheduleAPI = {
  create: (data) => api.post('/schedule/register', data),
  update: (data) => api.put('/schedule/update', data),
  cancel: (data) => api.delete('/schedule/delete', { data }),
  mySchedules: (cpf) => {
    if (!cpf) {
      console.error('Erro: CPF não fornecido para buscar agendamentos.')
      return Promise.reject('CPF obrigatório')
    }
    return api.get('/schedule/all', { params: { user_cpf: cpf } })
  },
  allSchedules: (date) => api.get('/schedule/all', {
    params: date ? { date } : {}
  }),
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