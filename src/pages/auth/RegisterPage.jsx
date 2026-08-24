import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { useToast } from '../../contexts/ToastContext'
import FormInput from '../../components/ui/FormInput'
import Spinner from '../../components/ui/Spinner'
import Logo from '../../components/ui/Logo'
import { maskCPF, validateCPF, getErrorMessage, passwordStrength } from '../../utils/helpers'
import { User, Mail, CreditCard, Lock, GraduationCap, MapPin } from 'lucide-react'

// Funcionário removido do cadastro público conforme instrução do backend
const TYPES = [
  { value: 'estudante', label: 'Estudante', icon: '🎓' },
  { value: 'convidado', label: 'Convidado', icon: '🤝' },
]

const ACADEMIC_UNITS = [
  { value: 'sede', label: 'Sede (Dois Irmãos)' },
  { value: 'uast', label: 'UAST (Serra Talhada)' },
]

export default function RegisterPage() {
  const [type, setType] = useState('estudante')
  const [form, setForm] = useState({
    name: '', email: '', cpf: '', password: '', confirmPassword: '',
    enrollment: '', academic_unit: '',
  })
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)
  const [emailHint, setEmailHint] = useState('')
  const { register } = useAuth()
  const { toast } = useToast()
  const navigate = useNavigate()

  const set = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }))

  useEffect(() => {
    if (type !== 'estudante') { setEmailHint(''); return }
    const v = form.email.trim()
    if (!v) { setEmailHint(''); return }
    if (v.includes('@') && !v.endsWith('@ufrpe.br')) setEmailHint('Use email institucional @ufrpe.br')
    else setEmailHint('')
  }, [form.email, type])

  const validate = () => {
    const e = {}
    if (!form.name.trim()) e.name = 'Nome obrigatório'
    if (!form.email.includes('@')) e.email = 'Email inválido'
    else if (type === 'estudante' && !form.email.endsWith('@ufrpe.br')) e.email = 'Use email institucional (@ufrpe.br)'
    if (form.cpf.replace(/\D/g, '').length !== 11) e.cpf = 'CPF deve ter 11 dígitos'
    if (form.password.length < 8) e.password = 'Mínimo 8 caracteres'
    if (form.password !== form.confirmPassword) e.confirmPassword = 'Senhas não coincidem'
    if (type === 'estudante' && !form.enrollment.trim()) e.enrollment = 'Matrícula obrigatória'
    if (!form.academic_unit) e.academic_unit = 'Selecione sua unidade acadêmica'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validate()) return
    setLoading(true)
    try {
      const payload = {
        role: type,
        name: form.name,
        email: form.email,
        cpf: form.cpf.replace(/\D/g, ''),
        password: form.password,
        enrollment: form.enrollment || '',
        academic_unit: form.academic_unit,
      }
      await register(payload)
      toast('Cadastro realizado! Faça login para continuar.')
      navigate('/login')
    } catch (err) {
      toast(getErrorMessage(err), 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-ru-cream flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        <div className="mb-8">
          <Logo variant="full" size={40} />
        </div>

        <div className="card">
          <h2 className="font-display font-bold text-xl text-ru-charcoal mb-1">Criar conta</h2>
          <p className="text-ru-muted text-sm font-body mb-6">Escolha seu tipo de acesso</p>

          <div className="flex gap-2 mb-6">
            {TYPES.map((t) => (
              <button
                key={t.value}
                type="button"
                onClick={() => setType(t.value)}
                className={`flex-1 flex flex-col items-center gap-1 py-3 rounded-xl border-2 text-xs font-body font-medium transition-all ${
                  type === t.value
                    ? 'border-ru-blue bg-blue-50 text-ru-blue'
                    : 'border-ru-cream-dark text-ru-muted hover:border-ru-blue/40'
                }`}
              >
                <span className="text-lg">{t.icon}</span>
                {t.label}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <FormInput label="Nome completo" icon={User} placeholder="Seu nome" value={form.name} onChange={set('name')} error={errors.name} />
            <div>
              <FormInput label="Email" icon={Mail} type="email"
                placeholder={type === 'convidado' ? 'seu@email.com' : 'seu@ufrpe.br'}
                value={form.email} onChange={set('email')} error={errors.email} />
              {emailHint && !errors.email && (
                <p className="text-xs text-amber-600 font-body mt-1 flex items-center gap-1">
                  <span>⚠️</span> {emailHint}
                </p>
              )}
            </div>
            <FormInput label="CPF" icon={CreditCard} placeholder="000.000.000-00"
              value={form.cpf}
              onChange={(e) => setForm((f) => ({ ...f, cpf: maskCPF(e.target.value) }))}
              error={errors.cpf} inputMode="numeric" />

            {/* Unidade Acadêmica — obrigatório para todos os tipos */}
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-body font-medium text-ru-charcoal">
                Unidade Acadêmica
              </label>
              <div className="grid grid-cols-2 gap-2">
                {ACADEMIC_UNITS.map((u) => (
                  <button
                    key={u.value}
                    type="button"
                    onClick={() => setForm((f) => ({ ...f, academic_unit: u.value }))}
                    className={`flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl border-2 text-xs font-body font-medium transition-all ${
                      form.academic_unit === u.value
                        ? 'border-ru-blue bg-blue-50 text-ru-blue'
                        : 'border-ru-cream-dark text-ru-muted hover:border-ru-blue/40'
                    }`}
                  >
                    <MapPin size={14} />
                    {u.label}
                  </button>
                ))}
              </div>
              {errors.academic_unit && <p className="text-xs text-red-500 font-body">{errors.academic_unit}</p>}
            </div>

            {type === 'estudante' && (
              <FormInput label="Matrícula" icon={GraduationCap} placeholder="202312345"
                value={form.enrollment} onChange={set('enrollment')} error={errors.enrollment} />
            )}

            <div>
              <FormInput label="Senha" icon={Lock} type="password" placeholder="Mínimo 8 caracteres"
                value={form.password} onChange={set('password')} error={errors.password} />
              {form.password && (() => {
                const s = passwordStrength(form.password)
                return (
                  <div className="mt-2">
                    <div className="flex gap-1 mb-1">
                      {[1,2,3].map(i => (
                        <div key={i} className={`h-1 flex-1 rounded-full transition-colors ${i <= s.level ? s.color : 'bg-gray-200'}`} />
                      ))}
                    </div>
                    <p className="text-xs font-body" style={{color: s.level === 1 ? '#ef4444' : s.level === 2 ? '#d97706' : '#059669'}}>
                      Força: {s.label}
                    </p>
                  </div>
                )
              })()}
            </div>
            <FormInput label="Confirmar senha" icon={Lock} type="password" placeholder="Repita a senha"
              value={form.confirmPassword} onChange={set('confirmPassword')} error={errors.confirmPassword} />

            <button type="submit" disabled={loading} className="btn-primary mt-2 flex items-center justify-center gap-2">
              {loading ? <Spinner size={18} /> : 'Criar conta'}
            </button>
          </form>

          <p className="text-center text-sm font-body text-ru-muted mt-5">
            Já tem conta?{' '}
            <Link to="/login" className="text-ru-blue font-medium hover:underline">Entrar</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
