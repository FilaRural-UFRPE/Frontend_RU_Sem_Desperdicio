import { Link } from 'react-router-dom'
import Logo from '../components/ui/Logo'

export default function NotFoundPage() {
  return (
    <div className="min-h-screen bg-ru-cream flex flex-col items-center justify-center text-center px-6">
      <div className="mb-6">
        <Logo variant="icon" size={64} />
      </div>
      <h1 className="font-display font-bold text-6xl text-ru-blue mb-2">404</h1>
      <p className="font-display font-semibold text-xl text-ru-charcoal mb-2">Página não encontrada</p>
      <p className="text-ru-muted font-body text-sm mb-8 max-w-xs">
        Essa página não existe ou foi removida. Volte para o início.
      </p>
      <Link to="/dashboard" className="btn-primary">Ir para o início</Link>
    </div>
  )
}
