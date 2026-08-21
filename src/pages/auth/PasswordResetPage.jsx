import { useState } from 'react'
import { Link, useSearchParams, useNavigate } from 'react-router-dom'
import { userAPI } from '../../services/api'
import { useToast } from '../../contexts/ToastContext'
import { getErrorMessage } from '../../utils/helpers'
import FormInput from '../../components/ui/FormInput'
import Spinner from '../../components/ui/Spinner'
import Logo from '../../components/ui/Logo'
import { Lock } from 'lucide-react'

function passwordStrength(pw) {
  if (!pw) return { level: 0, label: '', color: '' }
  let score = 0
  if (pw.length >= 8) score++
  if (pw.length >= 12) score++
  if (/[A-Z]/.test(pw)) score++
  if (/[0-9]/.test(pw)) score++
  if (/[^a-zA-Z0-9]/.test(pw)) score++
  if (score <= 2) return { level: 1, label: 'Fraca', color: 'bg-red-500' }
  if (score <= 3) return { level: 2, label: 'Média', color: 'bg-amber-500' }
  return { level: 3, label: 'Forte', color: 'bg-emerald-500' }
}

export default function PasswordResetPage() {
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token') || ''
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState({})
  const { toast } = useToast()
  const navigate = useNavigate()

  const validate = () => {
    const e = {}
    if (!token) e.token = 'Token inválido ou expirado. Solicita uma nova recuperação.'
    if (newPassword.length < 8) e.newPassword = 'Mínimo 8 caracteres'
    if (newPassword !== confirmPassword) e.confirmPassword = 'Senhas não coincidem'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validate()) return
    setLoading(true)
    try {
      await userAPI.passwordReset({
        token,
        new_password: newPassword,
      })
      toast('Senha redefinida com sucesso! Faz login com a nova senha.')
      navigate('/login')
    } catch (err) {
      toast(getErrorMessage(err), 'error')
    } finally {
      setLoading(false)
    }
  }

  const strength = passwordStrength(newPassword)

  return (
    <div className="min-h-screen bg-ru-cream flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        <div className="mb-8">
          <Logo variant="full" size={40} />
        </div>

        <div className="card">
          <h2 className="font-display font-bold text-xl text-ru-charcoal mb-1">Nova senha</h2>
          <p className="text-ru-muted text-sm font-body mb-6">
            Define a tua nova senha de acesso.
          </p>

          {errors.token && (
            <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 mb-4">
              <p className="text-red-600 text-sm font-body">{errors.token}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div>
              <FormInput
                label="Nova senha"
                icon={Lock}
                type="password"
                placeholder="Mínimo 8 caracteres"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                error={errors.newPassword}
              />
              {newPassword && (
                <div className="mt-2">
                  <div className="flex gap-1 mb-1">
                    {[1,2,3].map(i => (
                      <div key={i} className={`h-1 flex-1 rounded-full transition-colors ${i <= strength.level ? strength.color : 'bg-gray-200'}`} />
                    ))}
                  </div>
                  <p className="text-xs font-body" style={{color: strength.level === 1 ? '#ef4444' : strength.level === 2 ? '#d97706' : '#059669'}}>
                    Força: {strength.label}
                  </p>
                </div>
              )}
            </div>
            <FormInput
              label="Confirmar nova senha"
              icon={Lock}
              type="password"
              placeholder="Repete a nova senha"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              error={errors.confirmPassword}
            />

            <button type="submit" disabled={loading} className="btn-primary mt-2 flex items-center justify-center gap-2">
              {loading ? <Spinner size={18} /> : 'Redefinir senha'}
            </button>
          </form>

          <p className="text-center text-sm font-body text-ru-muted mt-5">
            <Link to="/login" className="text-ru-blue font-medium hover:underline">Voltar ao login</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
