import axios from 'axios'

const api = axios.create({
  baseURL: 'http://127.0.0.1:8000',
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
  login: (data) => api.post('/user/login', data),       // ✅ pronta
  register: (data) => api.post('/user/register', data), // ✅ pronta
}

// ─── Usuário ──────────────────────────────────────────
export const userAPI = {
  getAll: () => api.get('/users'),                                        // ✅ pronta
  updatePassword: (data) => api.put('/user/update_password', data),      // ✅ pronta
  deleteAccount: (cpf) => api.delete('/user/delete', { data: { cpf } }), // ✅ pronta
  me: () => api.get('/user'),                                             // ⏳ não pronta
}

// ─── Agendamentos ─────────────────────────────────────
export const scheduleAPI = {
  create: (data) => api.post('/schedule/register', data),   // ✅ pronta
  update: (data) => api.put('/schedule/update', data),      // ✅ pronta
  cancel: (data) => api.delete('/schedule/delete', { data }),// ✅ pronta
  mySchedules: (cpf) => {
    if (!cpf) {
      console.error('Erro: CPF não fornecido para buscar agendamentos.')
      return Promise.reject('CPF obrigatório')
    }
    return api.get('/schedules/all', { params: { user_cpf: cpf } }) // ✅ pronta
  },
  allSchedules: (date) => api.get('/schedules/all', {        // ✅ pronta
    params: date ? { date } : {}
  }),
}

// ─── Relatórios ───────────────────────────────────────
export const reportAPI = {
  demand: (date) => api.get('/reports/demand', {             // ✅ pronta
    params: { date }
  }),
  export: (date) => api.get('/reports/export', {             // ✅ pronta
    params: { date },
    responseType: 'blob'
  }),
}

export default api