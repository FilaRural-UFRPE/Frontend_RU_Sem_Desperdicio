import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { useToast } from '../../contexts/ToastContext'
import FormInput from '../../components/ui/FormInput'
import Spinner from '../../components/ui/Spinner'
import Logo from '../../components/ui/Logo'
import { maskCPF } from '../../utils/helpers'
import { Lock, CreditCard } from 'lucide-react'
import logoImg from '../../assets/logo.jpg'

export default function LoginPage() {
  const [cpf, setCpf] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState({})
  const [shake, setShake] = useState(false)
  const { login } = useAuth()
  const { toast } = useToast()
  const navigate = useNavigate()

  useEffect(() => {
    if (errors.form) {
      setShake(true)
      const t = setTimeout(() => setShake(false), 500)
      return () => clearTimeout(t)
    }
  }, [errors.form])

  const validate = () => {
    const e = {}
    if (cpf.replace(/\D/g, '').length !== 11) e.cpf = 'CPF deve ter 11 dígitos'
    if (!password) e.password = 'Informe sua senha'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validate()) return
    setLoading(true)
    try {
      const user = await login(cpf.replace(/\D/g, ''), password)
      toast(`Bem-vindo(a), ${user.name.split(' ')[0]}! 👋`)
      navigate('/dashboard')
    } catch (err) {
      const status = err.response?.status
      const serverMsg = err.response?.data?.message || err.response?.data?.msg
      if (status === 429) {
        setErrors({
          form: serverMsg || 'Muitas tentativas. Aguarde alguns minutos e tente novamente.',
        })
      } else {
        setErrors({ form: 'CPF ou senha incorretos. Tente novamente.' })
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-ru-cream flex">
      {/* Painel azul esquerdo */}
      <div className="hidden lg:flex flex-col justify-between w-[45%] bg-ru-blue p-12 relative overflow-hidden">
        <div className="absolute -top-24 -right-24 w-80 h-80 bg-ru-blue-light rounded-full opacity-30" />
        <div className="absolute bottom-16 -left-20 w-64 h-64 bg-ru-blue-dark rounded-full opacity-40" />
        <div className="absolute top-1/2 right-8 w-40 h-40 bg-ru-yellow opacity-10 rounded-full" />

        <div className="relative">
          <div className="flex items-center gap-4 mb-12">
            <img
              src={logoImg}
              alt="Smart RU"
              className="w-16 h-16 object-contain rounded-2xl bg-white/10 p-1"
            />
            <div>
              <p className="font-display font-bold text-white text-2xl leading-none">Smart RU</p>
              <p className="text-white/60 font-body text-sm">Sem Desperdício</p>
            </div>
          </div>

          <h1 className="font-display font-bold text-white text-4xl leading-tight mb-4">
            Refeições
            <br />
            inteligentes,
            <br />
            sem desperdício
          </h1>
          <p className="text-white/70 font-body text-lg leading-relaxed">
            Agende sua refeição no Restaurante Universitário e ajude a reduzir o desperdício de
            alimentos.
          </p>
        </div>

        <div className="relative flex gap-4">
          {[
            { value: '2.4k', label: 'Agendamentos/dia' },
            { value: '38%', label: 'Menos desperdício' },
          ].map((s) => (
            <div
              key={s.label}
              className="flex-1 bg-white/10 backdrop-blur rounded-xl p-4 border border-white/10"
            >
              <p className="font-display font-bold text-ru-yellow text-2xl">{s.value}</p>
              <p className="text-white/60 text-sm font-body">{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Painel de login direito */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-sm">
          <div className="lg:hidden mb-8">
            <Logo variant="full" size={44} />
          </div>

          <h2 className="font-display font-bold text-2xl text-ru-charcoal mb-1">Entrar</h2>
          <p className="text-ru-muted font-body text-sm mb-8">Use seu CPF e senha para acessar</p>

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
            <div>
              <FormInput
                label="Senha"
                icon={Lock}
                type="password"
                placeholder="Sua senha"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                error={errors.password}
              />
              {/* 👈 Link de recuperação de senha */}
              <div className="text-right mt-2">
                <Link
                  to="/recuperar-senha"
                  className="text-sm text-ru-blue font-body font-medium hover:underline py-2 px-1 inline-block"
                >
                  Esqueceste a senha?
                </Link>
              </div>
            </div>

            {/* Mensagem de erro geral */}
            {errors.form && (
              <div
                className={`bg-red-50 border-2 border-red-300 rounded-xl px-4 py-3 flex items-center gap-3 ${shake ? 'animate-shake' : ''}`}
              >
                <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <span className="text-red-600 text-sm font-bold">!</span>
                </div>
                <p className="text-red-700 text-sm font-body font-medium">{errors.form}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="btn-primary mt-2 flex items-center justify-center gap-2"
            >
              {loading ? <Spinner size={18} /> : 'Entrar'}
            </button>
          </form>

          <p className="text-center text-sm font-body text-ru-muted mt-6">
            Não tem conta?{' '}
            <Link to="/cadastro" className="text-ru-blue font-medium hover:underline">
              Criar cadastro
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
