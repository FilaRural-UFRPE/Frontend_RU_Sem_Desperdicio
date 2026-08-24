import { Navigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import LoadingScreen from './shared/LoadingScreen'

/**
 * Protege rotas que exigem autenticação.
 * allowedTypes: array de tipos permitidos. Vazio = qualquer autenticado.
 *
 * 401 → redireciona para login (tratado no api.js via interceptor)
 * 403 → redireciona para dashboard (sem permissão)
 */
export default function ProtectedRoute({ children, allowedTypes = [] }) {
  const { user, loading } = useAuth()

  if (loading) return <LoadingScreen />
  if (!user) return <Navigate to="/login" replace />
  if (allowedTypes.length > 0 && !allowedTypes.includes(user.type)) {
    return <Navigate to="/dashboard" replace />
  }

  return children
}
