import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { authAPI } from '../services/api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  // Restaura sessão do localStorage ao carregar
  useEffect(() => {
    const stored = localStorage.getItem('smartru_user')
    const token = localStorage.getItem('smartru_token')
    if (stored && token) {
      try { setUser(JSON.parse(stored)) } catch { /* ignora */ }
    }
    setLoading(false)
  }, [])

  const login = useCallback(async (cpf, password) => {
  const { data } = await authAPI.login({ cpf, password })
  
  if (data.success) {
    // Monta o objeto user com base no array retornado pelo backend
    const [role, name, email, userCpf, enrollment, register_date] = data.data
    
    const user = {
      type: role,
      name,
      email,
      cpf: userCpf,
      enrollment,
    }

    localStorage.setItem('smartru_token', 'token-provisorio')
    localStorage.setItem('smartru_user', JSON.stringify(user))
    setUser(user)
    return user
  }

  throw new Error(data.msg || 'Credenciais inválidas')
}, [])

  const register = useCallback(async (payload) => {
    const { data } = await authAPI.register(payload)
    return data
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem('smartru_token')
    localStorage.removeItem('smartru_user')
    setUser(null)
  }, [])

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth precisa estar dentro de AuthProvider')
  return ctx
}
