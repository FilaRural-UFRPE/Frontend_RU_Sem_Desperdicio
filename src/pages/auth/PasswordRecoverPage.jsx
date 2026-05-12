import { useState } from 'react'
import { Link } from 'react-router-dom'
import { userAPI } from '../../services/api'
import { useToast } from '../../contexts/ToastContext'
import { maskCPF, getErrorMessage } from '../../utils/helpers'
import FormInput from '../../components/ui/FormInput'
import Spinner from '../../components/ui/Spinner'
import Logo from '../../components/ui/Logo'
import { CreditCard, Mail, CheckCircle } from 'lucide-react'

export default function PasswordRecoverPage() {
  const [cpf, setCpf] = useState('')
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [errors, setErrors] = useState({})
  const { toast } = useToast()

  const validate = () => {
    const e = {}
    if (cpf.replace(/\D/g, '').length !== 11) e.cpf = 'CPF deve ter 11 dígitos'
    if (!email.includes('@')) e.email = 'Email inválido'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validate()) return
    setLoading(true)
    try {
      await userAPI.passwordRecover({
        cpf: cpf.replace(/\D/g, ''),
        email,
      })
      setSent(true)
    } catch (err) {
      toast(getErrorMessage(err), 'error')
    } finally {
      setLoading(false)
    }
  }

  if (sent) {
    return (
      <div className="min-h-screen bg-ru-cream flex items-center justify-center p-6">
        <div className="w-full max-w-md text-center">
          <div className="w-16 h-16 bg-emerald-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <CheckCircle size={32} className="text-emerald-600" />
          </div>
          <h2 className="font-display font-bold text-xl text-ru-charcoal mb-2">Email enviado!</h2>
          <p className="text-ru-muted font-body text-sm mb-6">
            Verifica a tua caixa de entrada e segue as instruções para redefinir a senha.
          </p>
          <Link to="/login" className="btn-primary inline-block">Voltar ao login</Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-ru-cream flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        <div className="mb-8">
          <Logo variant="full" size={40} />
        </div>

        <div className="card">
          <h2 className="font-display font-bold text-xl text-ru-charcoal mb-1">Recuperar senha</h2>
          <p className="text-ru-muted text-sm font-body mb-6">
            Insere o teu CPF e email para receber as instruções de recuperação.
          </p>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <FormInput
              label="CPF"
              icon={CreditCard}
              placeholder="000.000.000-00"
              value={cpf}
              onChange={(e) => setCpf(maskCPF(e.target.value))}
              error={errors.cpf}
              inputMode="numeric"
            />
            <FormInput
              label="Email"
              icon={Mail}
              type="email"
              placeholder="seu@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              error={errors.email}
            />

            <button type="submit" disabled={loading} className="btn-primary mt-2 flex items-center justify-center gap-2">
              {loading ? <Spinner size={18} /> : 'Enviar instruções'}
            </button>
          </form>

          <p className="text-center text-sm font-body text-ru-muted mt-5">
            Lembras da senha?{' '}
            <Link to="/login" className="text-ru-blue font-medium hover:underline">Entrar</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
