import { useState } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { userAPI } from '../../services/api'
import { useToast } from '../../contexts/ToastContext'
import { getErrorMessage, passwordStrength } from '../../utils/helpers'
import FormInput from '../../components/ui/FormInput'
import Spinner from '../../components/ui/Spinner'
import { Lock, CheckCircle } from 'lucide-react'

export default function ChangePasswordPage() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [form, setForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  })
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  const set = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }))

  const validate = () => {
    const e = {}
    if (!form.currentPassword) e.currentPassword = 'Informe a senha atual'
    if (form.newPassword.length < 8) e.newPassword = 'Mínimo 8 caracteres'
    if (form.newPassword !== form.confirmPassword) e.confirmPassword = 'Senhas não coincidem'
    if (form.currentPassword === form.newPassword)
      e.newPassword = 'A nova senha deve ser diferente da atual'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validate()) return
    setLoading(true)
    try {
      await userAPI.updatePassword({
        cpf: user.cpf,
        current_password: form.currentPassword,
        new_password: form.newPassword,
      })
      setSuccess(true)
      setForm({ currentPassword: '', newPassword: '', confirmPassword: '' })
      toast('Senha alterada com sucesso! ✅')
    } catch (err) {
      toast(getErrorMessage(err), 'error')
    } finally {
      setLoading(false)
    }
  }

  const strength = passwordStrength(form.newPassword)

  return (
    <div className="max-w-md mx-auto">
      <div className="mb-8">
        <h1 className="font-display font-bold text-2xl text-ru-charcoal">Alterar senha</h1>
        <p className="text-ru-muted font-body text-sm mt-1">
          Define uma nova senha para a tua conta
        </p>
      </div>

      {success && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3 flex items-center gap-3 mb-6">
          <CheckCircle size={18} className="text-emerald-600 flex-shrink-0" />
          <p className="text-emerald-700 text-sm font-body">Senha alterada com sucesso!</p>
        </div>
      )}

      <div className="card">
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <FormInput
            label="Senha atual"
            icon={Lock}
            type="password"
            placeholder="Tua senha atual"
            value={form.currentPassword}
            onChange={set('currentPassword')}
            error={errors.currentPassword}
          />
          <div>
            <FormInput
              label="Nova senha"
              icon={Lock}
              type="password"
              placeholder="Mínimo 8 caracteres"
              value={form.newPassword}
              onChange={set('newPassword')}
              error={errors.newPassword}
            />
            {form.newPassword && (
              <div className="mt-2">
                <div className="flex gap-1 mb-1">
                  {[1, 2, 3].map((i) => (
                    <div
                      key={i}
                      className={`h-1 flex-1 rounded-full transition-colors ${i <= strength.level ? strength.color : 'bg-gray-200'}`}
                    />
                  ))}
                </div>
                <p
                  className="text-xs font-body"
                  style={{
                    color:
                      strength.level === 1
                        ? '#ef4444'
                        : strength.level === 2
                          ? '#d97706'
                          : '#059669',
                  }}
                >
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
            value={form.confirmPassword}
            onChange={set('confirmPassword')}
            error={errors.confirmPassword}
          />

          <div className="bg-ru-cream rounded-xl p-3 mt-1">
            <p className="text-xs text-ru-muted font-body">A senha deve ter:</p>
            <ul className="text-xs text-ru-muted font-body mt-1 space-y-0.5">
              <li>• Mínimo 8 caracteres</li>
              <li>• Pelo menos uma letra maiúscula</li>
              <li>• Pelo menos um número</li>
              <li>• Pelo menos um símbolo (!@#$...)</li>
            </ul>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn-primary flex items-center justify-center gap-2"
          >
            {loading ? <Spinner size={18} /> : 'Alterar senha'}
          </button>
        </form>
      </div>
    </div>
  )
}
