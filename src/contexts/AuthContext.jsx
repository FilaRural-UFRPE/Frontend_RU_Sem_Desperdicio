import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { authAPI } from '../services/api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const stored = localStorage.getItem('smartru_user')
    if (stored) {
      try {
        setUser(JSON.parse(stored))
      } catch {
        localStorage.removeItem('smartru_user')
      }
    }
    setLoading(false)
  }, [])

  const login = useCallback(async (cpf, password) => {
    const { data } = await authAPI.login({ cpf, password })

    if (data.success) {
      const [role, name, email, userCpf, enrollment, academic_unit] = data.data

      const user = {
        type: role,
        name,
        email,
        cpf: userCpf,
        enrollment,
        academic_unit: academic_unit || 'sede', // fallback para compatibilidade
      }

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

  const logout = useCallback(async () => {
    try {
      await authAPI.logout()
    } catch {
      /* ignora erro de rede no logout */
    }
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
